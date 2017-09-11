<template>
  <div class="topo-node"
    :style="{transform: transformValue}"
    v-stream:mousedown="mousedown$"
    v-stream:mouseup="mouseup$">
    <header class="topo-node-header">mysql</header>
    <div class="topo-node-body">
      <div class="line">
        <span class="label">镜像</span>
        <span class="content">mysql:1.10.0</span>
      </div>
      <div class="line">
        <span class="label">实例数</span>
        <span class="content">1</span>
      </div>
      <div class="line">
        <span class="label">CPU 限制</span>
        <span class="content">1 核</span>
      </div>
      <div class="line">
        <span class="label">内存限制</span>
        <span class="content">1G</span>
      </div>
      <div class="line">
        <span class="label">访问方式</span>
        <span class="content">主机端口</span>
      </div>
      <div class="line">
        <span class="label">开放端口</span>
        <span class="content">80/TCP,38443:443/TCP</span>
      </div>
    </div>
  </div>
</template>

<script>

export default {
  name: 'TopoNode',
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
          console.log(event)
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
