<template>
  <div id="code-section" v-if="isCodeSectionVisible">
    <header id="code-header">
      <div class="code-tab active">YAML 编排</div><!--
    --><div class="code-tab">错误消息</div><!--
    --><div class="code-tab">帮助文档</div>
    </header>
    <div id="code-main">
      <codemirror v-model="yaml"></codemirror>
    </div>
    <footer id="code-footer">
      <div class="footer-btn active">保存</div><!--
    --><div class="footer-btn">取消</div>
    </footer>
  </div>
</template>

<script>
import yaml2json from 'js-yaml';
import Bus from '../bus.js';

export default {
  name: 'CodeSection',
  props: ['yaml'],
  data() {
    return {
      isCodeSectionVisible: true,
    }
  },
  created() {
    Bus.$on('toogle-code-section', () => {
      console.log('toogle-code-section')
      this.isCodeSectionVisible = !this.isCodeSectionVisible;
    });
  },
}
</script>

<style lang="scss">
</style>
