<template>
  <compose-topo :yaml="yaml"></compose-topo>
</template>

<script>
import ComposeTopo from './components/compose-topo/compose-topo'
import yaml from './yaml'

export default {
  name: 'app',
  components: {
    ComposeTopo
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
