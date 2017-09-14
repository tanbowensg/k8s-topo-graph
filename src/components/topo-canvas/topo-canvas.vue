<template>
  <div id="graph-canvas">
    <zoom-ratio v-model="zoomRatio"></zoom-ratio>
    <button id="toogle-code-section" @click="toggleCodeSection">→</button>
    <div id="canvas-container" :style="canvasStyle" ref="canvasContainer">
      <topo-node v-for="node in nodes" v-if="isReady"
        :key="node.name"
        :info="node"
        :class="{active: activeNode === node.name}"
        :style="convertPositionToTransform(nodePositions[node.name])"
        :zoomRatio="zoomRatio"
        :x="nodePositions[node.name].x"
        :y="nodePositions[node.name].y"
        @move="onNodeMove"
        @mousedown="onNodeMousedown"></topo-node>
      <svg id="canvas-lines" xmlns="http://www.w3.org/2000/svg" version="1.1" class="viewport"
          width="100%" height="100%">
        <path v-for="l in lines" :d="convertToSvgPath(l[0], l[1], l[2], l[3])"
          :stroke="l[4] ? '#fac832' : '#fff'"
          :opacity="l[4] ? 0.9 : 0.6"
          stroke-width="2"
          stroke-linecap="round">
        </path>
      </svg>
    </div>
  </div>
</template>

<script>
import yaml2json from 'js-yaml';
import TopoNode from '../topo-node/topo-node';
import ZoomRatio from '../zoom-ratio/zoom-ratio';
import Bus from '../bus.js';
import { PivotOffsetY, PivotOffsetXLarge, PivotOffsetXSmall } from '../../const.js'

export default {
  name: 'TopoCanvas',
  props: ['nodes'],
  components: {
    TopoNode,
    ZoomRatio
  },
  data() {
    // 记录所有节点的位置，用来划线。
    // 注意：这里的位置是每个节点左上角的位置，没有加偏移量
    const nodePositions = {};
    _.forEach(this.nodes, n => {
      nodePositions[n.name] = {x: 0, y: 0};
    });

    // 记录节点的依赖图
    // 形如{dependent: [dependency1,dependency2]}
    const dependencyGraph = {};
    // 这里和上面我总共遍历了两次，其实可以合并。但我不合并的理由是看起来更清楚一点，而且对性能影响不大。
    _.forEach(this.nodes, n => {
      if (n.dependencies.length > 0) {
        dependencyGraph[n.name] = n.dependencies;
      }
    })

    // 这是要画的所有节点之间的线的关系，根据 dependencyGraph 得到
    // 形如[[dependent, dependency],[dependent, dependency],[dependent, dependency]]
    let nodeLines = [];
    _.forEach(dependencyGraph, (dependencies, dependent) => {
      const sides = _.map(dependencies, dependency => [dependent, dependency]);
      nodeLines = nodeLines.concat(sides);
    });
    
    return {
      activeNode: '',
      nodePositions,
      dependencyGraph,
      nodeLines,
      zoomRatio: 1,
      // 这个 isReady 只有在 mounted 之后才会设为 true
      // 目的是为了让画布计算出每个节点的位置后，再创建节点
      isReady: false
    }
  },
  computed: {
    // 所有要画的节点的线的坐标
    lines() {
      return _.map(this.nodeLines, ([dependent, dependency]) => {
        // 形如[x1, y1, x2, y2]
        const linePosition = [0, 0, 0, 0];
        // dependent 要加小的x 偏移量，dependency要加大的
        linePosition[0] = this.nodePositions[dependent].x + PivotOffsetXSmall;
        linePosition[1] = this.nodePositions[dependent].y + PivotOffsetY;
        linePosition[2] = this.nodePositions[dependency].x + PivotOffsetXLarge;
        linePosition[3] = this.nodePositions[dependency].y + PivotOffsetY;
        // 和当前选中的节点相连的线要变黄
        linePosition[4] = dependent === this.activeNode || dependency === this.activeNode;
        return linePosition;
      })
    },
    canvasStyle() {
      const transform = `transform: translate(-50%, -50%) scale(${this.zoomRatio});`;
      const height = `height: ${1 / this.zoomRatio * 100}%;`;
      const width = `width: ${1 / this.zoomRatio * 100}%;`;
      return `${transform}${height}${width}`;
    },
  },
  created() {
    Bus.$on('zoom-ratio-change', ratio => {
      this.zoomRatio = ratio;
    });
  },
  mounted() {
    // 计算出每个节点的初始坐标
    const computeInitNodePosition = (nodes, dependencyGraph) => {
      // 计算每个节点的依赖层级
      // 听说可以用沃舍尔算法，有空优化
      function computeDependenciesLevel(graph, nodes) {
        const allNodesName = _.map(nodes, node => node.name);
        // memoTable 是保存每个节点依赖层级的表
        const memoTable = {};
        // nodesParent 保存每个节点的父节点
        const nodesParent = {};
        // yaml 是不会有循环依赖的，所以这里也不考虑环
        _.forEach(graph, (dependencies, node) => {
          if (!memoTable[node]) memoTable[node] = 0;
          if (!nodesParent[node]) nodesParent[node] = null;
          _.forEach(dependencies, dependency => {
            // 父节点是会变的
            nodesParent[dependency] = node;
            // 当前节点的依赖等级在它父节点的基础上加一
            memoTable[dependency] = memoTable[node] + 1
          })
        });
        // nodesParent 是动态改变的。memoTable 保存只是当时这个节点的层级。
        // 所以最后要根据 nodesParent 和 memoTable 重新计算依赖等级
        // 但是首先要对 memoTable 进行排序，先计算层级低的，再计算层级高的
        const memoTableSorted = _.chain(memoTable).toPairs().sortBy(_.last).value();
        const result = {};
        _.forEach(memoTableSorted, ([node, level], index) => {
          const parent = nodesParent[node];
          if (!parent) {
            // 表示它是顶级节点
            result[node] = 0;
          } else {
            // 否则就查表，每个节点的依赖等级在它父节点基础上加一
            result[node] = _.find(memoTableSorted, pair => pair[0] === parent)[1] + 1;
            // 同时再去更新 memoTableSorted 中该节点的层级
            _.find(memoTableSorted, pair => pair[0] === node)[1] = result[node];
          }
        });

        return result;
      }
      
      // 计算整个依赖图作为一个二维数组的大小（列数和行数）
      function computeDependencySize(dependenciesLevel) {
        const array = _.toArray(dependenciesLevel)
        // 二维数组的长度，表示画布中的列数
        const x = _.max(array) + 1;
        // 二维数组的深度，表示画布中的行数
        const y = _.chain(array).countBy().toPairs().maxBy(_.last).last().toNumber().value();
        return [x, y];
      }

      // 把画布分割成 x * y 块，返回一个 x * y 的数组，每个元素是每一块的中点
      const divideCanvas = ([x, y]) => {
        // 求近似的缩放率
        function computeRatio(current, target) {
          const ratio = current / target;
          if (ratio < 0.75) return 0.5;
          if (ratio >= 0.75 && ratio < 1) return 0.75;
          if (ratio >= 1) return 1;
        }
        // TODO：这里就假装每个节点宽244，高120
        const requireWidth = x * 244;
        const requireHeight = y * 120;
        const canvasHeight = this.$refs.canvasContainer.clientHeight;
        const canvasWidth = this.$refs.canvasContainer.clientWidth;
        const ratio = _.min([computeRatio(canvasHeight, requireHeight), computeRatio(canvasWidth, requireWidth)]);
        // 先算算预期需要多大画布
        const targetHeight = canvasHeight / ratio;
        const targetWidth = canvasWidth / ratio;

        const xList = _.map(Array(x),
          (v, i) => targetWidth / x * (i + 1)  - targetWidth / x / 2 );
        const yList = _.map(Array(y),
          (v, i) => targetHeight / y * (i + 1) - targetHeight / y / 2 );
        
        const canvasDivisions = _.map(Array(x), (v, i) => {
          return _.map(Array(y), (vv, j) => [xList[i], yList[j]]);
        });

        return {
          ratio,
          canvasDivisions,
        }
      }

      // 把每块画布的坐标映射到每个节点上
      function mapToCoodinateToNodes (dependenciesLevel, canvasCoodinateSystem) {
        const nodesCoodinate = {};
        const columesNumber = canvasCoodinateSystem.length;
        const nodeColumns = _.map(Array(columesNumber), () => []);

        _.forEach(dependenciesLevel, (level, node) => {
          // columesNumber 不是数组长度，减了 1 才是
          nodeColumns[(columesNumber - 1) - level].push(node);
        });
        _.forEach(nodeColumns, (column, i) => {
          _.forEach(column, (node, j) => {
            let [x, y] = canvasCoodinateSystem[i][j];
            // 还要把中心对齐
            // TODO：这里就假装每个节点宽244，高120
            x = x - 244 / 2;
            y = y - 120 / 2;
            nodesCoodinate[node] = {x, y};
          })
        })
        return nodesCoodinate
      }

      const dependenciesLevel = computeDependenciesLevel(this.dependencyGraph, nodes);
      const dependencySize = computeDependencySize(dependenciesLevel)
      const canvasCoodinateSystem = divideCanvas(dependencySize);
      Bus.$emit('zoon-ratio-change', canvasCoodinateSystem.ratio);
      return mapToCoodinateToNodes(dependenciesLevel, canvasCoodinateSystem.canvasDivisions);
    }
    this.nodePositions = computeInitNodePosition(this.nodes, this.dependencyGraph);
    this.isReady = true;
  },
  methods: {
    convertToSvgPath(x1, y1, x2, y2) {
      return `M${x1},${y1}L${x2},${y2}`;
    },
    // 把节点的位置转换成 transform 属性
    convertPositionToTransform({x, y}) {
      return `transform: translate(${x}px, ${y}px)`
    },
    // 更新移动的节点的位置
    onNodeMove({name, x, y}) {
      this.nodePositions[name].x = this.nodePositions[name].x + x;
      this.nodePositions[name].y = this.nodePositions[name].y + y;
    },
    onNodeMousedown(nodeName) {
      this.activeNode = nodeName;
    },
    toggleCodeSection() {
      Bus.$emit('toogle-code-section');
    }
  },
}
</script>

<style lang="scss">
#graph-canvas #zoom-ratio {
  position: absolute;
  z-index: 1;
  right: 50px;
  top: 10px;
}
#graph-canvas #toogle-code-section {
  display: block;
  height: 26px;
  width: 30px;
  position: absolute;
  z-index: 1;
  right: 10px;
  top: 10px;


  line-height: 26px;
  font-size: 18px;
  color: white;
  border-radius: 4px;
  background-color: #151515;
  box-shadow: 0 0 4px 0 rgba(0, 0, 0, 0.2);
  border: none;
  cursor: pointer;
  outline: none;
}
</style>
