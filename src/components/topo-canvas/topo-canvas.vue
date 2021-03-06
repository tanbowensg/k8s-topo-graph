<template>
  <div id="graph-canvas"
    v-stream:mousewheel="mousewheel$"
    v-stream:mousedown="mousedown$" >
    <zoom-ratio v-model="zoomRatio"></zoom-ratio>
    <button id="toogle-code-section" @click="toggleCodeSection">→</button>
    <div id="canvas-container" :style="canvasStyle" ref="canvasContainer">
      <topo-node v-for="node in nodes" v-if="isReady"
        :key="node.id"
        :info="node"
        :class="{active: activeNode === node.id}"
        :style="convertPositionToTransform(nodePositions[node.id])"
        :zoomRatio="zoomRatio"
        :x="nodePositions[node.id].x"
        :y="nodePositions[node.id].y"
        @move="onNodeMove"></topo-node>
      <svg id="canvas-lines" xmlns="http://www.w3.org/2000/svg" version="1.1" class="viewport"
          width="100%" height="100%">
        <path v-for="l in linesCoordinates" :d="convertToSvgPath(l[0], l[1], l[2], l[3])"
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
  domStreams: ['mousewheel$', 'mousedown$'],
  components: {
    TopoNode,
    ZoomRatio
  },
  data() {
    // 记录所有节点的位置，用来划线。
    // 注意：这里的位置是每个节点左上角的位置，没有加偏移量
    const nodePositions = {};
    _.forEach(this.nodes, n => {
      nodePositions[n.id] = {x: 0, y: 0};
    });

    return {
      activeNode: '',
      nodePositions,
      zoomRatio: 1,
      // 画布的中心，用在 transform-origin
      // TODO：有点困难，先不做
      // canvasCenter: ['50%', '50%'],
      // 这个 isReady 只有在 mounted 之后才会设为 true
      // 目的是为了让画布计算出每个节点的位置后，再创建节点
      isReady: false,
      // 用来表示拖拽画布的状态的
      canvasOffset: {x: 10, y: 30},
    }
  },
  subscriptions() {
    // 鼠标滚动
    this.mousewheel$.subscribe(event => {
      const e = event.event;
      e.preventDefault();
      // 把画布中心挪到鼠标滚轮位置
      // this.canvasCenter = [e.offsetX, e.offsetY];
      const delta = e.wheelDeltaY;
      if (delta > 0) Bus.$emit('zoom-ratio-plus');
      if (delta < 0) Bus.$emit('zoom-ratio-minus');
    });
  },
  computed: {
    dependencyGraph() {
      const dependencyGraph = {};
      // 这里和上面我总共遍历了两次，其实可以合并。但我不合并的理由是看起来更清楚一点，而且对性能影响不大。
      _.forEach(this.nodes, n => {
        dependencyGraph[n.id] = n.dependencies;
      })
      return dependencyGraph;
    },
    nodeLines() {
      // 这是要画的所有节点之间的线的关系，根据 dependencyGraph 得到
      // 形如[[dependent, dependency],[dependent, dependency],[dependent, dependency]]
      let nodeLines = [];
      _.forEach(this.dependencyGraph, (dependencies, dependent) => {
        const sides = _.map(dependencies, dependency => [dependent, dependency]);
        nodeLines = nodeLines.concat(sides);
      });
      return nodeLines;
    },
    // 所有要画的节点的线的坐标
    linesCoordinates() {
      return _.map(this.nodeLines, ([dependent, dependency]) => {
        // 形如[x1, y1, x2, y2]
        const linePosition = [0, 0, 0, 0];
        if (this.nodePositions[dependent] && this.nodePositions[dependency]) {
          // 判断一下依赖的节点是否存在
          // dependent 要加小的x 偏移量，dependency要加大的
          linePosition[0] = this.nodePositions[dependent].x + PivotOffsetXSmall;
          linePosition[1] = this.nodePositions[dependent].y + PivotOffsetY;
          linePosition[2] = this.nodePositions[dependency].x + PivotOffsetXLarge;
          linePosition[3] = this.nodePositions[dependency].y + PivotOffsetY;
          // 和当前选中的节点相连的线要变黄
          linePosition[4] = dependent === this.activeNode || dependency === this.activeNode;
        }
        return linePosition;
      })
    },
    canvasStyle() {
      // 这个比例让画布可以居中，神奇公式，推导出来的
      const translateScale = `${-50 / this.zoomRatio}%`
      const translateX = `calc(${translateScale} + ${this.canvasOffset.x}px)`;
      const translateY = `calc(${translateScale} + ${this.canvasOffset.y}px)`;
      const transform = `transform: scale(${this.zoomRatio}) translate(${translateX}, ${translateY});`;
      // const transformOrigin = `transform-origin: ${this.canvasCenter[0]}px ${this.canvasCenter[1]}px;`
      const height = `height: ${1 / this.zoomRatio * 100}%;`;
      const width = `width: ${1 / this.zoomRatio * 100}%;`;
      return `${transform}${height}${width}`;
    },
  },
  created() {
    Bus.$on('zoom-ratio-change', ratio => {
      this.zoomRatio = ratio;
    });
    Bus.$on('activate-node', nodeId => {
      this.onActivateNode(nodeId);
    });
  },
  mounted() {
    const mousemove$ = Rx.Observable.fromEvent(document, 'mousemove');
    const mouseup$ = Rx.Observable.fromEvent(document, 'mouseup');
    const mouseDrag$ = this.mousedown$.switchMap(() => {
      return mousemove$.takeUntil(mouseup$)
        .map(event => {
          return {x: event.movementX, y: event.movementY}
        });
    })
    .scan((acc, {x, y}) => {
      // 要算上缩放比
      const newY = acc.y + y / this.zoomRatio;
      const newX = acc.x + x / this.zoomRatio;
      return {
        x: newX,
        y: newY,
      }
    }, {x: 0, y: 0})
    // 实现拖动画布的逻辑
    this.$subscribeTo(mouseDrag$, canvasOffset => {
      this.canvasOffset = canvasOffset;
    })
    // 计算每个节点的初始位置
    this.nodePositions = this.computeInitNodePosition(this.nodes, this.dependencyGraph);
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
    onNodeMove({id, x, y}) {
      this.nodePositions[id].x = this.nodePositions[id].x + x;
      this.nodePositions[id].y = this.nodePositions[id].y + y;
    },
    onActivateNode(nodeId) {
      this.activeNode = nodeId;
    },
    toggleCodeSection() {
      Bus.$emit('toogle-code-section');
    },
    // 计算出每个节点的初始坐标
    computeInitNodePosition(nodes, dependencyGraph) {
      // 计算每个节点的依赖层级，没有依赖关系的节点不在这个层级中
      // TODO: 听说可以用沃舍尔算法，有空优化
      function computeDependenciesLevel(graph, nodes) {
        const allNodesId = _.map(nodes, node => node.id);
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
            // 如果该节点没有父节点
            if (dependencyGraph[node].length > 0) {
              // 而且有依赖，那就表示它是顶级节点
              result[node] = 0;
            } else {
              // 否则表示它和其他节点都没有依赖关系，依赖层级为 -1
              result[node] = -1;
            }

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
        let x = _.max(array) + 1;
        // 如果有依赖层级为 -1 的节点，那么就单开一列来展示它
        if (_.includes(array, -1)) x = x + 1;
        // 二维数组的深度，表示画布中的行数
        const y = _.chain(array).countBy().toPairs().maxBy(_.last).last().toNumber().value();

        // 分两种情况，一种是完全没有依赖关系，即x = 1；另一种是其他情况
        if (x === 1) {
          // 如果只有一列，那么就直接无视依赖关系，把所有节点平铺
          // TODO：暂且就算 3 列，可能可以用贪心算法
          return [3, Math.ceil(y / 3)];
        }
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

        // 是否完全没有依赖关系，即全都是自由节点
        const isNoDependency = _.max(_.toArray(dependenciesLevel)) === -1;
        if (isNoDependency) {
          // 如果完全没有依赖关系，那就一个个把节点平铺开
          const nodes = _.keys(dependenciesLevel);
          for (let i = 0; i < nodes.length; i++) {
            nodeColumns[i % columesNumber].push(nodes[i]);
          }
        } else {
          // 是否存在依赖层级为 -1 的节点，简称自由节点
          const existFreeNode = _.includes(dependenciesLevel, -1);
          // 否则就按照层级排列
          _.forEach(dependenciesLevel, (level, node) => {
            if (existFreeNode) {
              // 存在自由节点就要 -2
              nodeColumns[(columesNumber - 2) - level].push(node);
            } else {
              // 一般情况 -1
              nodeColumns[(columesNumber - 1) - level].push(node);
            }
          });
        }

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
      Bus.$emit('zoom-ratio-change', canvasCoodinateSystem.ratio);
      return mapToCoodinateToNodes(dependenciesLevel, canvasCoodinateSystem.canvasDivisions);
    },
  },
  watch: {
    nodes() {
      // 监听 nodes 的变化，如果新传进来的 nodes 出现了一些原本没有的 nodes，或者一些本来有的 nodes 没有了
      // 那么就要把旧的 nodes 从 nodePositions 里弄出去，把新的加进来
      _.forEach(this.nodes, newNode => {
        if (!this.nodePositions[newNode.id]) {
          this.$set(this.nodePositions, newNode.id, {x: 0, y: 0});
        }
      });
    },
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
