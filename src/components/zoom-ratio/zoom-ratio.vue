<template>
  <div id="zoom-ratio">
    <button class="zoom-ratio-button" @click="minus">-</button><!--
 --><input class="zoom-ratio-input" v-model="percent" @blur="emit" @keydown.enter="emit"><!--
 --><button class="zoom-ratio-button" @click="plus">+</button>
  </div>
</template>

<script>
export default {
  name: 'ZoomRatio',
  props: ['value'],
  data() {
    return {
      number: 1,
    };
  },
  computed: {
    percent: {
      get() {
        return `${Math.round(this.number * 100)}%`;
      },
      set(input) {
        const val = input.replace('%', '') / 100;
        if (val < 0.5) this.number = 0.5;
        else if (val > 2) this.number = 2;
        else this.number = val;
      }
    }
  },
  methods: {
    emit() {
      this.$emit('input', this.number)
    },
    minus() {
      const val = this.number - 0.25;
      if (val < 0.5) this.number = 0.5;
      else this.number = val;
      this.emit();
    },
    plus() {
      const val = this.number + 0.25;
      if (val > 2) this.number = 2;
      else this.number = val;
      this.emit();
    },
  },
  watch: {
    value(val) {
      this.number = val;
    },
  },
}
</script>

<style lang="scss">
#zoom-ratio {
  display: flex;
  width: 110px;
  height: 26px;
  border-radius: 4px;
  background-color: #151515;
  box-shadow: 0 0 4px 0 rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.zoom-ratio-input {
  display: block;
  flex: 1 1 auto;
  width: 0px;

  background-color: #151515;
  color: white;
  border: none;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

.zoom-ratio-button {
  display: block;
  flex: 0 0 auto;
  height: 26px;
  width: 30px;

  line-height: 26px;
  font-size: 18px;
  color: white;
  background-color: #151515;
  border: none;
  cursor: pointer;
  outline: none;
}
</style>
