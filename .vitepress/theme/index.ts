import DefaultTheme from 'vitepress/theme'
import { h, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vitepress'
import mediumZoom from 'medium-zoom'
import GuigeLogo from './components/GuigeLogo.vue'
import VideoPlayer from './components/VideoPlayer.vue'
import Comment from './components/Comment.vue'
import SidebarToggle from './components/SidebarToggle.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'nav-bar-title-before': () => h(GuigeLogo),
      'nav-bar-content-after': () => h(VideoPlayer),
      'doc-after': () => h(Comment),
      'sidebar-nav-before': () => h(SidebarToggle),
    })
  },
  setup() {
    const route = useRoute()
    const initZoom = () => {
      mediumZoom('.main img', { background: 'rgba(0,0,0,0.8)' })
    }
    onMounted(() => { nextTick(initZoom) })
    watch(() => route.path, () => { nextTick(initZoom) })
  }
}
