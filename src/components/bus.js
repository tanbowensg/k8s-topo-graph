import Vue from 'vue'

const bus = new Vue();

bus.$on('toogle-code-section', () => {
  bus.$nextTick(() => {
    bus.$emit('canvas-size-change')
  });
});

export default bus;