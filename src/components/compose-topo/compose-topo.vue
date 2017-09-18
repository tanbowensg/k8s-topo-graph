<template>
  <div id="compose-topo-container">
    <div id="dce-compose-topo">
      <header id="dce-compose-topo-header">
        <div id="app-name">ndc/my-app</div>
        <ul id="pages">
          <li class="page active">服务</li><!--
       --><li class="page">网络</li><!--
       --><li class="page">存储</li>
        </ul>
      </header>
      <div id="dce-compose-topo-body">
        <topo-canvas :nodes="deployments"></topo-canvas>
        <code-section :yaml="yaml"></code-section>
      </div>
    </div>
  </div>
</template>

<script>
import yaml2json from 'js-yaml';
import TopoCanvas from '../topo-canvas/topo-canvas';
import CodeSection from '../code-section/code-section';
import Bus from '../bus.js';

export default {
  name: 'ComposeTopo',
  props: ['rawData'],
  components: {
    CodeSection,
    TopoCanvas
  },
  data() {
    return {
      yaml: this.rawData,
      isCodeSectionVisible: false,
    }
  },
  created() {
    Bus.$on('toogle-code-section', () => {
      this.isCodeSectionVisible = !this.isCodeSectionVisible;
    });

    Bus.$on('yaml-change', yaml => {
      this.yaml = yaml;
    });
  },
  computed: {
    json() {
      return yaml2json.safeLoadAll(this.yaml);
    },
    deployments() {
      function getDeploymentDependencies(deployment) {
        return _.get(deployment, 'metadata.annotations["io.daocloud.dce/depend-on"]') || [];
      }

      // 先取出所有服务的依赖，用于判断一个服务是否有依赖
      const allDependencies = _.reduce(this.json, (all, deployment) => {
        const dependencies = getDeploymentDependencies(deployment);
        return all.concat(dependencies)
      }, [])

      // 处理各个节点要展示的数据
      return _.map(this.json, deployment => {
        return  {
          name: deployment.metadata.name,
          dependencies: getDeploymentDependencies(deployment),
          // 是否拥有依赖
          hasDependency: getDeploymentDependencies(deployment).length > 0,
          // 是否是其他节点的依赖
          isDependency: allDependencies.indexOf(deployment.metadata.name) > -1,
          values: [
            ['镜像', _.get(deployment, 'spec.template.spec.containers[0].image', '')],
            ['实例数', _.get(deployment, 'spec.replicas', 0)],
            ['CPU 限制', _.get(deployment, 'spec.template.spec.containers[0].resources.limits.cpu', 0)],
            ['内存限制', _.get(deployment, 'spec.template.spec.containers[0].resources.limits.memory', 0)],
          ],
        };
      });
    },
  },
  watch: {
    rawData(rawData) {
      this.yaml = rawData;
    }
  }
}
</script>

<style lang="scss">
@import './compose-topo.scss';
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
ul {
  list-style: none;
}
</style>
