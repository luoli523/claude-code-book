import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import GuigeLogo from './components/GuigeLogo.vue'
import VideoPlayer from './components/VideoPlayer.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'nav-bar-title-before': () => h(GuigeLogo),
      'nav-bar-content-before': () => h(VideoPlayer),
    })
  }
}
