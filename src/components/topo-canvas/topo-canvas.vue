<template>
  <div id="graph-canvas">
    <topo-node v-for="d in deployments" :key="d.name" :info="d"></topo-node>
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
    }
  },
}
</script>

<style lang="scss">
</style>
