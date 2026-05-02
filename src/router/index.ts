import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user';
import useVisitData from '@/utils/useVisitData';
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'root',
      component: () => import('@/layouts/MainLayout.vue'),
      redirect: { name: 'home' },
      children: [
        {
          path: '/home',
          name: 'home',
          component: () => import('@/pages/home/HomePage.vue'),
        },
        {
          path: '/learn',
          name: 'learn',
          component: () => import('@/pages/learn/LearnPage.vue'),
        },

      ]
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/login/LoginPage.vue'),
    },
    {
      path: '/courseware',
      name: 'courseware',
      component: () => import('@/pages/courseware/CoursewarePage.vue'),
      props: route => ({
        course_num: route.query.course_num,
        fz_id: route.query.fz_id,
        xq_code: route.query.xq_code
      })
    },
    {
      path: '/course-replay',
      name: 'course-replay',
      component: () => import('@/pages/replay/CourseReplayPage.vue'),
      props: route => ({
        courseId: route.query.courseId,
        cId: route.query.cId,
        xkhId: route.query.xkhId,
        xqCode: route.query.xqCode,
        teacherId: route.query.teacherId,
        rpId: route.query.rpId,
        timeTableId: route.query.timeTableId,
        userLevel: route.query.userLevel,
        courseToPage: route.query.courseToPage,
        dataSource: route.query.dataSource,
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
