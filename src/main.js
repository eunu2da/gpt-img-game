import Vue from 'vue';
import App from './App.vue';
import router from './router';
import VueSocketIO from 'vue-socket.io';
import SocketIO from 'socket.io-client';
import './assets/main.css';

Vue.config.productionTip = false;

const socketConnection = SocketIO('http://localhost:4000');
Vue.use(new VueSocketIO({
  debug: true,
  connection: socketConnection
}));

Vue.prototype.$socket = socketConnection;

new Vue({
  router,
  render: h => h(App),
  mounted() {
    // 두 번 클릭 확대 방지
    document.addEventListener('gesturestart', function (e) {
      e.preventDefault();
    });

    let lastTouchEnd = 0;
    document.addEventListener('touchend', function (event) {
      const now = (new Date()).getTime();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, false);
  }
}).$mount('#app');
