<template>
  <div id="graph-canvas">
    <topo-node v-for="node in nodes"
      :key="node.name"
      :info="node"
      :class="{active: activeNodeList[node.name]}"
      @move="renewNodesPositions"
      @mousedown="onNodeMousedown"></topo-node>
    <svg id="canvas-lines" xmlns="http://www.w3.org/2000/svg" version="1.1" class="viewport"
         width="100%" height="100%">
      <path v-for="l in lines" :d="convertToSvgPath(l[0], l[1], l[2], l[3])"
        stroke="#fff"
        opacity="0.6"
        stroke-width="2"
        stroke-linecap="round">
      </path>
    </svg>
  </div>
</template>

<script>
import yaml2json from 'js-yaml';
import TopoNode from '../topo-node/topo-node';
import { PivotOffsetY, PivotOffsetXLarge, PivotOffsetXSmall } from '../../const.js'

export default {
  name: 'TopoCanvas',
  props: ['nodes'],
  components: {
    TopoNode
  },
  data() {
    const activeNodeList = {};
    _.forEach(this.nodes, n => {
      activeNodeList[n.name] = false;
    });

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
      activeNodeList,
      nodePositions,
      nodeLines,
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
        return linePosition;
      })
    },
  },
  methods: {
    convertToSvgPath(x1, y1, x2, y2) {
      return `M${x1},${y1}L${x2},${y2}`;
    },
    renewNodesPositions({name, x, y}) {
      // 更新移动的节点的位置
      this.nodePositions[name].x = x;
      this.nodePositions[name].y = y;
    },
    onNodeMousedown(nodeName) {
      _.forEach(this.activeNodeList, (isActive, index) => {
        this.activeNodeList[index] = false;
      })
      this.activeNodeList[nodeName] = true;
    }
  }
}
</script>

<style lang="scss">
</style>
