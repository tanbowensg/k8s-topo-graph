<template>
  <div id="topo-graph-container">
    <div id="dce-topo-graph">
      6666
    </div>
  </div>
</template>

<script>
import Hello from './components/Hello'

export default {
  name: 'app',
  components: {
    Hello
  }
}
</script>

<style lang="scss">
// 拓扑图的大小是容器决定的
#topo-graph-container {
  height: 600px;
  width: 800px;
}
#dce-topo-graph{
  background: grey;
  height: 100%;
  width: 100%;
}
</style>
