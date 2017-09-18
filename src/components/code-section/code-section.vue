<template>
  <div id="code-section" v-if="isCodeSectionVisible">
    <header id="code-header">
      <div class="code-tab active">YAML 编排</div><!--
    --><div class="code-tab">错误消息</div><!--
    --><div class="code-tab">帮助文档</div>
    </header>
    <div id="code-main" class="jamie-cm">
      <codemirror v-model="yaml" :options="codeMirrorOption" ref="cm"></codemirror>
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
  extraKeys: {
    // 手动缩进时使用空格替换 Tab
    // 空格的数量由 'indentUnit' 配置决定，默认为 2
    Tab: cm => {
      const spaces = Array(cm.getOption('indentUnit') + 1).join(' ');
      cm.replaceSelection(spaces, 'end');
    },
    'Ctrl-Enter': cm => {
      cm.setOption('fullScreen', !cm.getOption('fullScreen'));
    },
  },
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
      window.cm = this.$refs.cm.editor
      return this.$refs.cm.editor;
    },
  },
  created() {
    Bus.$on('toogle-code-section', () => {
      this.isCodeSectionVisible = !this.isCodeSectionVisible;
    });
    Bus.$on('activate-node', nodeName => {
      this.highlightCode(_.find(this.codeFragments, { name: nodeName }));
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

      const onName = line => {
        // 首先判断是不是在读取 metadata
        if (inMetadata) {
          // 如果是的话，这个名字才是这个部分的名字
          _.last(codeFragments).name = line.text.replace('name:', '').trim();
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
      // 注释掉的这段才是真正的给每行代码加背景颜色的功能，但是这样很消耗性能
      // for (let i = 0; i < this.cm.lineCount() - 1; i++) {
      //   if (i >= codeFragment.startLine && i < codeFragment.endLine) {
      //     this.cm.addLineClass(i, null, 'highlight-line')
      //   } else {
      //     this.cm.removeLineClass(i, null, 'highlight-line')
      //   }
      // }
      const codeMirrorLineHeight = 15;
      // 然后滚动到那一行
      this.cm.scrollTo(null, codeMirrorLineHeight * codeFragment.startLine);
    }
  },
}
</script>

<style lang="scss">
@import './jamie-cm.scss';
</style>
