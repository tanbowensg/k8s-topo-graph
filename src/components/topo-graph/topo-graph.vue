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
        <topo-canvas :yaml="yaml"></topo-canvas>
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
  name: 'TopoGraph',
  props: ['yaml'],
  components: {
    TopoCanvas
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
