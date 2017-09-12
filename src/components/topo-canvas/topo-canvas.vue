<template>
  <div id="graph-canvas">
    <topo-node v-for="node in nodes" :key="node.name" :info="node" @move="renewNodesPositions"></topo-node>
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

// 这是连线的点相对于每个节点左上角的偏移量
const PivotOffsetY = 14;
const PivotOffsetXLarge = 228;
const PivotOffsetXSmall = 12;

export default {
  name: 'TopoCanvas',
  props: ['nodes'],
  components: {
    TopoNode
  },
  data() {
    // 记录所有节点的位置，用来划线，这是加了偏移量的
    const nodePositions = {};
    _.forEach(this.nodes, n => {
      nodePositions[n.name] = {x: PivotOffsetXLarge, y: PivotOffsetY};
    });

    // 记录节点的依赖图
    const dependencyGraph = {};
    // 这里和上面我总共遍历了两次，其实可以合并。但我不合并的理由是看起来更清楚一点，而且对性能影响不大。
    _.forEach(this.nodes, n => {
      if (n.dependencies.length > 0) {
        dependencyGraph[n.name] = n.dependencies;
      }
    })

    // 这是要画的所有节点之间的线，根据 dependencyGraph 得到
    let nodeLines = [];
    _.forEach(dependencyGraph, (dependencies, dependent) => {
      const sides = _.map(dependencies, dependency => [dependent, dependency]);
      nodeLines = nodeLines.concat(sides);
    });
    return {
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
        linePosition[0] = this.nodePositions[dependent].x
        linePosition[1] = this.nodePositions[dependent].y
        linePosition[2] = this.nodePositions[dependency].x
        linePosition[3] = this.nodePositions[dependency].y
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
      // TODO：先假设连接点都在右上
      this.nodePositions[name].x = x + PivotOffsetXLarge;
      this.nodePositions[name].y = y + PivotOffsetXSmall;
    },
  }
}
</script>

<style lang="scss">
</style>
