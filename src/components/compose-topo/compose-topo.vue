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
        <div id="code-section">
          <header id="code-header">
            <div class="code-tab active">YAML 编排</div><!--
          --><div class="code-tab">错误消息</div><!--
          --><div class="code-tab">帮助文档</div>
          </header>
          <div id="code-main">
          </div>
          <footer id="code-footer">
            <div class="footer-btn active">保存</div><!--
         --><div class="footer-btn">取消</div>
          </footer>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import yaml2json from 'js-yaml';
import TopoCanvas from '../topo-canvas/topo-canvas';

export default {
  name: 'ComposeTopo',
  props: ['yaml'],
  components: {
    TopoCanvas
  },
  data() {
    return {
      json: yaml2json.safeLoadAll(this.yaml)
    }
  },
  computed: {
    deployments() {
      function getDeploymentDependencies(deployment) {
        return _.get(deployment, 'metadata.annotations["io.daocloud.dce/depend-on"]', []);
      }

      // // 先取出所有服务的依赖，用于判断一个服务是否有依赖
      // const allDependencies = _.reduce(this.json, (all, deployment) => {
      //   const dependencies = getDeploymentDependencies(deployment);
      //   return all.concat(dependencies)
      // }, [])

      // 处理各个节点要展示的数据
      return _.map(this.json, deployment => {
        return  {
          name: deployment.metadata.name,
          dependencies: getDeploymentDependencies(deployment),
          // // 是否拥有依赖
          // hasDependency: getDeploymentDependencies(deployment).length > 0,
          // // 是否是其他节点的依赖
          // isDependency: allDependencies.indexOf(deployment.metadata.name) > -1,
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