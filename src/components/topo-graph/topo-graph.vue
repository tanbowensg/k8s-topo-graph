<template>
  <div id="topo-graph-container">
    <div id="dce-topo-graph">
      <header id="dce-topo-graph-header">
        <div id="app-name">ndc/my-app</div>
        <ul id="pages">
          <li class="page active">服务</li><!--
       --><li class="page">网络</li><!--
       --><li class="page">存储</li>
        </ul>
      </header>
      <div id="dce-topo-graph-body">
        <div id="graph-canvas">
          <topo-node v-for="d in deployments" :key="d.name" :info="d"></topo-node>
        </div>
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
import TopoNode from '../topo-node/topo-node';

export default {
  name: 'TopoGraph',
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
@import './topo-graph.scss';
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
ul {
  list-style: none;
}
</style>
