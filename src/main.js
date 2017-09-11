// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './app'
import Rx from 'rxjs/Rx';
import VueRx from 'vue-rx';

Vue.config.productionTip = false

Vue.use(VueRx, Rx);

/* eslint-disable no-new */
new Vue({
  el: '#app',
  template: '<App/>',
  components: { App }
})
