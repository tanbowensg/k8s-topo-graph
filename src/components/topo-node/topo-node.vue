<template>
  <div class="topo-node"
    ref="topoNode"
    v-stream:mousedown="mousedown$">
    <header class="topo-node-header">
      <div class="pivot left" v-if="info.hasDependency"></div>
      <div class="pivot right" v-if="info.isDependency"></div>
      <span>{{info.name}}</span>
    </header>
    <div class="topo-node-body">
      <div class="line" v-for="content in info.values">
        <span class="label">{{content[0]}}</span>
        <span class="content">{{content[1]}}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TopoNode',
  props: ['info', 'zoomRatio'],
  domStreams: ['mousedown$'],
  data(){
    return {
      x: 0,
      y: 0,
      maxX: Infinity,
      maxY: Infinity,
    };
  },
  computed: {
    minX() {
      // 本来这里的 0 应该是 6 * this.zoomRatio，6 是阴影宽度。但是太麻烦了，就先不减了
      return 0;
    },
    minY() {
      return 0;
    },
  },
  mounted() {
    this.getMaxSize();
  },
  subscriptions() {
    // {x: xxx, y: xxx}
    const mousemove$ = Rx.Observable.fromEvent(document, 'mousemove');
    const mouseup$ = Rx.Observable.fromEvent(document, 'mouseup');
    const mouseDrag$ = this.mousedown$.switchMap(() => {
      return mousemove$.takeUntil(mouseup$)
        .map(event => {
          return {x: event.movementX, y: event.movementY}
        })
    })
    .scan((acc, {x, y}) => {
      let finalX, finalY;
      // 要算上缩放比
      const newX = acc.x + x / this.zoomRatio;
      const newY = acc.y + y / this.zoomRatio;
      // 以免超出上限和下限
      if (newX < this.minX) finalX = this.minX;
      else if (newX > this.maxX) finalX = this.maxX;
      else finalX = newX;

      if (newY < this.minY) finalY = this.minY;
      else if (newY > this.maxY) finalY = this.maxY;
      else finalY = newY;

      return {
        x: finalX,
        y: finalY,
      }
    }, {x: this.minX, y: this.minY})

    this.$subscribeTo(mouseDrag$, position => {
      this.x = position.x;
      this.y = position.y;
      this.emitMovement();
    })

    this.$subscribeTo(this.mousedown$, this.emitMousedown);
  },
  methods: {
    getMaxSize() {
      const parentWidth = this.$refs.topoNode.parentElement.clientWidth;
      this.maxX = parentWidth - this.$refs.topoNode.clientWidth - 0;
      const parentHeight = this.$refs.topoNode.parentElement.clientHeight;
      this.maxY = parentHeight - this.$refs.topoNode.clientHeight - 0;
    },
    emitMovement() {
      const payload = {
        name: this.info.name,
        x: this.x,
        y: this.y
      };
      this.$emit('move', payload);
    },
    emitMousedown() {
      this.$emit('mousedown', this.info.name);
    }
  },
  watch: {
    zoomRatio() {
      this.$nextTick(this.getMaxSize);
    }
  }
}
</script>

<style lang="scss">
@import './topo-node.scss';
</style>
