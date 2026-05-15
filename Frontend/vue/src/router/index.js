import { createRouter, createWebHistory } from 'vue-router'
import { getAuth, onAuthStateChanged } from 'firebase/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'LandingPage',
      component: () => import('../views/LandingPage.vue'),
    },
    {
      path: '/avatar',
      name: 'Avatar',
      component: () => import('../views/AvatarView.vue'),
      meta: { requiereAuth: true },
    },
    {
      path: '/WhatsApp',
      name: 'WhatsApp',
      component: () => import('../views/WhatsApp.vue'),
      meta: { requiereAuth: true },
    },
  ],
})

router.beforeEach((to) => {
  return new Promise((resolve) => {
    const auth = getAuth()
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      if (to.meta.requiereAuth && !user) {
        resolve({ name: 'LandingPage' })
      } else {
        resolve(true)
      }
    })
  })
})

export default router
