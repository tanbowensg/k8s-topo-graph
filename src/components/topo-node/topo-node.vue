<template>
  <div class="topo-node">
    <header class="topo-node-header">mysql</header>
    <div class="topo-node-body">
      <div class="line">
        <span class="label">镜像</span>
        <span class="content">mysql:1.10.0</span>
      </div>
      <div class="line">
        <span class="label">实例数</span>
        <span class="content">1</span>
      </div>
      <div class="line">
        <span class="label">CPU 限制</span>
        <span class="content">1 核</span>
      </div>
      <div class="line">
        <span class="label">内存限制</span>
        <span class="content">1G</span>
      </div>
      <div class="line">
        <span class="label">访问方式</span>
        <span class="content">主机端口</span>
      </div>
      <div class="line">
        <span class="label">开放端口</span>
        <span class="content">80/TCP,38443:443/TCP</span>
      </div>
    </div>
  </div>
</template>

<script>

export default {
  name: 'TopoNode',
}
</script>

<style lang="scss">
@import './topo-node.scss';
</style>
