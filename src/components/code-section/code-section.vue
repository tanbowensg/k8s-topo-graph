<template>
  <div id="code-section" v-show="isCodeSectionVisible">
    <header id="code-header">
      <div class="code-tab active">YAML 编排</div><!--
    --><div class="code-tab">错误消息</div><!--
    --><div class="code-tab">帮助文档</div>
    </header>
    <div id="code-main" class="jamie-cm">
      <codemirror :code="yaml" :options="codeMirrorOption" @change="onCodeChange" ref="cm"></codemirror>
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

const CODEMIRROR_DEFAULT = {
  lineNumbers: true,
  indentWithTabs: false, // 自动缩进时不使用 Tab 缩进而是使用空格
  lineWrapping: true,
  styleActiveLine: true,
  mode: 'text/x-yaml',
};
export default {
  name: 'CodeSection',
  props: ['yaml'],
  data() {
    return {
      isCodeSectionVisible: true,
      codeMirrorOption: CODEMIRROR_DEFAULT,
      codeFragments: [],
      highlightMark: null,
    }
  },
  computed: {
    cm() {
      return this.$refs.cm.editor;
    },
  },
  created() {
    Bus.$on('toogle-code-section', () => {
      this.isCodeSectionVisible = !this.isCodeSectionVisible;
      this.$nextTick(() => {
        this.cm.refresh();
      });
    });
    Bus.$on('activate-node', nodeId => {
      const target = _.find(this.codeFragments, { id: nodeId });
      // 由于存储没有自己专属的代码块，所以这种情况就不跳转。有自己的代码块的情况下才跳转
      if (target) this.highlightCode(target);
    });
  },
  mounted() {
    this.codeFragments = this.getNodeFragments();
  },
  methods: {
    // 把 yaml 分割成一个个部分，每个部分是一个服务
    getNodeFragments() {
      const codeFragments = [];
      // 用来判断当前是否正在读取 metaData
      let inMetadata = false;
      let currentKind = '';

      const onFragmentStart = line => {
        const lineNumber = this.cm.getLineNumber(line);
        // 创建一个新部分
        codeFragments.push({
          startLine: lineNumber,
        })
      }

      const onFragmentMetadataStart = () => {
        inMetadata = true;
      }
      
      const onKind = line => {
        currentKind = line.text.replace('kind:', '').trim();;
      }
      
      const onName = line => {
        // 首先判断是不是在读取 metadata
        if (inMetadata) {
          // 如果是的话，就可以获取这一部分的 id 了
          const name = line.text.replace('name:', '').trim();
          _.last(codeFragments).id = `${currentKind}_${name}`;
          inMetadata = false;
        }
      }

      const onFragmentEnd = line => {
        const lineNumber = this.cm.getLineNumber(line);
        // 创建一个新部分
        _.last(codeFragments).endLine = lineNumber - 1;//减1是为了减掉 --- 的那行
      }

      this.cm.eachLine(line => {
        // 如果以 apiVersion: 开头，表示一个部分的开始
        if (_.startsWith(line.text, 'apiVersion:')) {
          onFragmentStart(line);
        }
        if (_.startsWith(line.text, 'metadata:')) {
          onFragmentMetadataStart();
        }
        if (_.startsWith(line.text, 'kind:')) {
          onKind(line);
        }
        if (_.includes(line.text, 'name:')) {
          onName(line);
        }
        if (_.startsWith(line.text, '---')) {
          onFragmentEnd(line);
        }
      })

      // 由于最后一行没有 ---，所以手动结束它
      _.last(codeFragments).endLine = this.cm.lineCount() - 1;

      return codeFragments;
    },
    highlightCode(codeFragment) {
      if (this.highlightMark) {
        this.highlightMark.clear();
      }
      // 先标记
      this.highlightMark = this.cm.markText(
        {
          line: codeFragment.startLine,
          ch: 0
        }, {
          line: codeFragment.endLine,
          ch: 99999999},
        {
          className: "highlight-line"
        }
      );
      const codeMirrorLineHeight = 15;
      // 然后滚动到那一行
      this.cm.scrollTo(null, codeMirrorLineHeight * codeFragment.startLine);
    },
    onCodeChange(yaml) {
      try {
        // 判断一下 yaml 合不合法
        const json = yaml2json.safeLoadAll(yaml);
        Bus.$emit('yaml-change', yaml);
      } catch(e) {
      }
    },
  },
  watch: {
    yaml() {
      this.codeFragments = this.getNodeFragments();
    },
  },
}
</script>

<style lang="scss">
@import './jamie-cm.scss';
</style>
