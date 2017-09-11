<template>
  <topo-graph :yaml="yaml"></topo-graph>
</template>

<script>
import TopoGraph from './components/topo-graph/topo-graph'
import yaml from './yaml'

export default {
  name: 'app',
  components: {
    TopoGraph
  },
  data() {
    return {
      yaml
    }
  }
}
</script>

<style lang="scss">
</style>
