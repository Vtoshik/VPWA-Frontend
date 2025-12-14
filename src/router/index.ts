import { defineRouter } from '#q-app/wrappers';
import {
  createRouter,
  createWebHashHistory,
  createWebHistory,
  createMemoryHistory,
} from 'vue-router';
import routes from './routes';
import { wsService } from 'src/services/websocket';
import type { Member } from 'src/services/models';

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

  // Track if we've already initialized WebSocket for this session
  let wsInitialized = false;

  Router.beforeEach((to, _from, next) => {
    const userStr = localStorage.getItem('currentUser');
    const isAuthRoute = to.path.startsWith('/auth');

    if (!userStr && !isAuthRoute) {
      return next('/auth/login');
    }

    if (userStr && isAuthRoute) {
      return next('/');
    }

    // Initialize WebSocket connection based on user status (only once per session)
    if (userStr && !isAuthRoute && !wsInitialized) {
      try {
        const user: Member = JSON.parse(userStr);
        const token = localStorage.getItem('auth_token');

        if (token) {
          // Only connect if user is not offline
          if (user.status !== 'offline') {
            console.log(`Initializing WebSocket - user status: ${user.status}`);
            wsService.connect(token);
          } else {
            console.log('User is offline - WebSocket will not connect');
          }
          wsInitialized = true;
        }
      } catch (error) {
        console.error('Error initializing WebSocket:', error);
      }
    }

    return next();
  });

  return Router;
});
