import Vue from 'vue'

const bus = new Vue({
  data: {
    zoomRatio: 1,
    yaml: '',
  },
  created() {
    this.$on('toogle-code-section', () => {
      this.$nextTick(() => {
        this.$emit('canvas-size-change')
      });
    });

    this.$on('yaml-change', yaml => {
      this.yaml = yaml;
    });

    this.$on('zoom-ratio-plus', () => {
      const val = this.zoomRatio + 0.25;
      if (val > 2) this.zoomRatio = 2;
      else this.zoomRatio = val;
    });

    this.$on('zoom-ratio-minus', () => {
      const val = this.zoomRatio - 0.25;
      if (val < 0.5) this.zoomRatio = 0.5;
      else this.zoomRatio = val;
    });
  },
  watch: {
    zoomRatio() {
      this.$emit('zoom-ratio-change', this.zoomRatio);
    }
  }
});


export default bus;