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
import Bus from '../bus.js';

export default {
  name: 'TopoNode',
  props: ['info', 'zoomRatio' ,'x', 'y'],
  domStreams: ['mousedown$'],
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
      // 要算上缩放比
      const newX = acc.x + x / this.zoomRatio;
      const newY = acc.y + y / this.zoomRatio;

      return {
        x: newX,
        y: newY,
      }
    }, {x: this.x, y: this.y})

    this.$subscribeTo(mouseDrag$, newPosition => {
      this.emitMovement(newPosition);
    })

    this.$subscribeTo(this.mousedown$, event => {
      event.event.stopPropagation();
      this.emitMousedown();
    });
  },
  methods: {
    emitMovement(newPosition) {
      // 只要通知最后位移的距离就可以了
      const payload = {
        name: this.info.name,
        x: newPosition.x - this.x,
        y: newPosition.y - this.y
      };
      this.$emit('move', payload);
    },
    emitMousedown() {
      this.$emit('mousedown', this.info.name);
    }
  },
}
</script>

<style lang="scss">
@import './topo-node.scss';
</style>
