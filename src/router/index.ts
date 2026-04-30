import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user';
import useVisitData from '@/utils/useVisitData';
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'root',
      component: () => import('@/views/RootView.vue'),
      redirect: { name: 'home' },
      children: [
        {
          path: '/about',
          name: 'about',
          component: () => import('@/views/AboutView.vue'),
        },
        {
          path: '/home',
          name: 'home',
          component: () => import('@/views/HomeView.vue'),
        },
        {
          path: '/learn',
          name: 'learn',
          component: () => import('@/views/LearnView.vue'),
        },
        {
          path: '/ai',
          name: 'ai',
          component: () => import('@/views/AIView.vue'),
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
router.beforeEach((to) => {
  const userStore = useUserStore();
  useVisitData();
  if (!userStore.isAuthenticated && to.path !== '/login') return { name: 'login' }
  if (userStore.isAuthenticated && to.path === '/login') return { name: 'home' }
  return true
});
export default router
