import Vue from 'vue';
import Router from 'vue-router';
import ClientView from '@/views/ClientView.vue';
import ServerView from '@/views/ServerView.vue';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Client',
      component: ClientView
    },
    {
      path: '/server',
      name: 'Server',
      component: ServerView
    }
  ]
});
