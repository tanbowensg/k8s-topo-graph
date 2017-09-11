<template>
  <div class="topo-node"
    :style="{transform: transformValue}"
    v-stream:mousedown="mousedown$"
    v-stream:mouseup="mouseup$">
    <header class="topo-node-header">{{info.name}}</header>
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
  domStreams: ['mousedown$', 'mouseup$'],
  data(){
    return {
      x: 0,
      y: 0,
    };
  },
  computed: {
    transformValue() {
      return `translate(${this.x}px, ${this.y}px)`
    }
  },
  subscriptions() {
    // {x: xxx, y: xxx}
    const mousemove$ = Rx.Observable.fromEvent(document, 'mousemove');
    const mouseDrag$ = this.mousedown$.switchMap(() => {
      return mousemove$.takeUntil(this.mouseup$)
        .map(event => {
          return {x: event.movementX, y: event.movementY}
        })
    })

    this.$subscribeTo(mouseDrag$, movement => {
      this.x = this.x + movement.x;
      this.y = this.y + movement.y;
    })
  }
}
</script>

<style lang="scss">
@import './topo-node.scss';
</style>
