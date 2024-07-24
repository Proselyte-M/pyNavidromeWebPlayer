import '@/style/main.scss'
import Vue, { markRaw, watch } from 'vue'
import Vuex from 'vuex'
import Router from 'vue-router'
import AppComponent from '@/app/App.vue'
import { createApp } from '@/shared/compat'
import { components } from '@/shared/components'
import { setupRouter } from '@/shared/router'
import { useMainStore } from '@/shared/store'
import { API } from '@/shared/api'
import { createAuth } from '@/auth/service'
import { createPlayerStore } from './player/store'
import { createApi } from '@/shared'
import { createPinia, PiniaVuePlugin } from 'pinia'
import { useFavouriteStore } from '@/library/favourite/store'
import { usePlaylistStore } from '@/library/playlist/store'

declare module 'vue/types/vue' {
  interface Vue {
    $api: API
  }
}

declare module 'pinia' {
  export interface PiniaCustomProperties {
    api: API;
  }
}

Vue.use(Vuex)
Vue.use(Router)
Vue.use(PiniaVuePlugin)

const auth = createAuth()
const api = createApi(auth)
const router = setupRouter(auth)

const pinia = createPinia()
  .use(({ store }) => {
    store.api = markRaw(api)
  })

const mainStore = useMainStore(pinia)
const playerStore = createPlayerStore(mainStore, api)

// 自动登录
async function autoLogin() {
  try {
    const autoLoggedIn = await auth.autoLogin()
    if (autoLoggedIn) {
      // 登录成功，继续应用的初始化
      app.use(auth)
      app.use(api)
      await Promise.all([
        useFavouriteStore().load(),
        usePlaylistStore().load(),
      ])
    } else {
      // 登录失败，可能需要显示登录页面或处理错误
      console.log('自动登录失败')
      router.push('/login') // 跳转到登录页面
    }
  } catch (error) {
    console.error('自动登录时发生错误', error)
    router.push('/login') // 跳转到登录页面
  }
}

// 路由守卫
router.beforeEach((to, from, next) => {
  mainStore.clearError()
  if (to.path === '/login' && auth.isAuthenticated()) {
    next('/') // 已登录用户跳过登录页面
  } else if (to.path !== '/login' && !auth.isAuthenticated()) {
    next('/login') // 未登录用户重定向到登录页面
  } else {
    next()
  }
})

// 创建应用实例
const app = createApp(AppComponent, { router, pinia, store: playerStore })

app.config.errorHandler = (err: Error) => {
  console.error(err)
  mainStore.setError(err)
}

Object.entries(components).forEach(([key, value]) => {
  app.component(key, value as any)
})

// 执行自动登录
autoLogin().then(() => {
  app.mount('#app')
})
