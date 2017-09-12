<template>
  <div class="topo-node"
    ref="topoNode"
    :style="{transform: transformValue}"
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
  props: ['info'],
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
    transformValue() {
      return `translate(${this.x}px, ${this.y}px)`
    }
  },
  mounted() {
    // 最大 X 和 Y就是节点可以拖动的范围上限
    // 注意：额外减 2 的是阴影
    this.maxX = this.$refs.topoNode.parentElement.clientWidth - this.$refs.topoNode.clientWidth - 2;
    this.maxY = this.$refs.topoNode.parentElement.clientHeight - this.$refs.topoNode.clientHeight - 2;
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
      const newX = acc.x + x;
      const newY = acc.y + y;
        // 以免超出上限和下限
      if (newX < 0) finalX = 0;
      else if (newX > this.maxX) finalX = this.maxX;
      else finalX = newX;

      if (newY < 0) finalY = 0;
      else if (newY > this.maxY) finalY = this.maxY;
      else finalY = newY;

      return {
        x: finalX,
        y: finalY,
      }
    }, {x: 0, y: 0})

    this.$subscribeTo(mouseDrag$, position => {
      this.x = position.x;
      this.y = position.y;
      this.emitMovement();
    })

    this.$subscribeTo(this.mousedown$, this.emitMousedown);
  },
  methods: {
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
  }
}
</script>

<style lang="scss">
@import './topo-node.scss';
</style>
