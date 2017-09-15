<template>
  <compose-topo :yaml="yaml"></compose-topo>
</template>

<script>
import ComposeTopo from './components/compose-topo/compose-topo'
import Bus from './components/bus.js'
import yaml from './yaml'

export default {
  name: 'app',
  components: {
    ComposeTopo
  },
  data() {
    return {
      yaml
    };
  },
  created() {
    Bus.$emit('yaml-change', this.yaml);
  },
  watch: {
    yaml() {
      Bus.$emit('yaml-change', this.yaml);
    }
  }
}
</script>

<style lang="scss">
</style>
