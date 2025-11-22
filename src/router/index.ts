import { defineRouter } from '#q-app/wrappers';
import {
  createRouter,
  createWebHashHistory,
  createWebHistory,
  createMemoryHistory,
} from 'vue-router';
import routes from './routes';
export default defineRouter(() => {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory;
  const Router = createRouter({
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });
  Router.beforeEach((to, _from, next) => {
  const user = localStorage.getItem('currentUser');
  const isAuthRoute = to.path.startsWith('/auth');
  if (!user && !isAuthRoute) {
    return next('/auth/login');
  }
  if (user && isAuthRoute) {
    return next('/');
  }
  return next();
  });
return Router;
});