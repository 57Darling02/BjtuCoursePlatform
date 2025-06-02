import { createRouter, createWebHistory, type NavigationGuardNext, type RouteLocationNormalized } from 'vue-router'
import { useUserStore } from '@/stores/user';
import { emitter } from '@/utils';
import useVisitData from '@/utils/useVisitData';
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      redirect: { name: 'homespace' },
      children: [
        {
          path: '/about',
          name: 'about',
          component: () => import('@/views/AboutView.vue'),
        },
        {
          path: '/homespace',
          name: 'homespace',
          component: () => import('@/views/HomeSpace.vue'),
        },
        {
          path: '/learnspace',
          name: 'learnspace',
          component: () => import('@/views/LearnSpace.vue'),
        },

      ]
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
    },
    {
      path: '/courseware',
      name: 'courseware',
      component: () => import('@/views/CoursewarePanel.vue'),
      props: route => ({
        course_num: route.query.course_num,
        fz_id: route.query.fz_id,
        xq_code: route.query.xq_code
      })
    },
  ],
})
router.beforeEach((to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
  const userStore = useUserStore();
  useVisitData();
  if (to.path !== '/login' && !userStore.isAuthenticated) {
    next('/login');
  } else if (userStore.isAuthenticated && to.path === '/login') {
    next('/')
  } else {
    next();
  }
});
export default router
emitter.on('UPDATE_INFO', () => {
  if (router.currentRoute.value.path === '/login') {
    router.push('/');
  }
})