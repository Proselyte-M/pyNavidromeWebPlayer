import Vue from 'vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import App from './App.vue'
import APlayer from '@moefe/vue-aplayer';
import router from './router';

const app = createApp(App);
app.use(router);

Vue.use(ElementUI)

new Vue({
  el: '#app',
  render: h => h(App)
})

Vue.use(APlayer, {
  defaultCover: 'https://github.com/u3u.png',
  productionTip: true,
});
