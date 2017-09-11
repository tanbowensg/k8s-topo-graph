<template>
  <div id="graph-canvas">
    <topo-node v-for="d in deployments" :key="d.name" :info="d"></topo-node>
    <svg id="canvas-lines" xmlns="http://www.w3.org/2000/svg" version="1.1" class="viewport"
         width="100%" height="100%">
      <path :d="convertToSvgPath(120, 300, 400, 50)" stroke="#fff" stroke-width="1.1" opacity="0.6"
      ></path>
    </svg>
  </div>
</template>

<script>
import yaml2json from 'js-yaml';
import TopoNode from '../topo-node/topo-node';

export default {
  name: 'TopoCanvas',
  props: ['yaml'],
  components: {
    TopoNode
  },
  data() {
    return {
      json: yaml2json.safeLoadAll(this.yaml)
    }
  },
  computed: {
    deployments() {
      // 处理各个节点要展示的数据
      return _.map(this.json, deployment => {
        return  {
          name: deployment.metadata.name,
          values: [
            ['镜像', _.get(deployment, 'spec.template.spec.containers[0].image'), ''],
            ['实例数', _.get(deployment, 'spec.replicas'), 0],
            ['CPU 限制', _.get(deployment, 'spec.template.spec.containers[0].resources.limits.cpu'), 0],
            ['内存限制', _.get(deployment, 'spec.template.spec.containers[0].resources.limits.memory'), 0],
          ],
        };
      });
    },
  },
  methods: {
    convertToSvgPath(x1, y1, x2, y2) {
      return `M${x1},${y1}L${x2},${y2}`;
    }
  }
}
</script>

<style lang="scss">
</style>
