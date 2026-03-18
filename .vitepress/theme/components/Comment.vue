<template>
  <div class="comment-wrapper">
    <div id="waline"></div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vitepress'

const route = useRoute()
let walineInstance = null

async function initWaline() {
  if (walineInstance) {
    walineInstance.destroy()
    walineInstance = null
  }
  const { init } = await import('https://unpkg.com/@waline/client@v3/dist/waline.js')
  walineInstance = init({
    el: '#waline',
    serverURL: 'https://waline-server-amber.vercel.app',
    lang: 'zh-CN',
    pageview: true,
    comment: true,
    site: 'claude-code-book',
  })
}

onMounted(() => { initWaline() })
watch(() => route.path, () => { initWaline() })
onUnmounted(() => { if (walineInstance) walineInstance.destroy() })
</script>

<style>
@import 'https://unpkg.com/@waline/client@v3/dist/waline.css';

.comment-wrapper {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid var(--vp-c-divider);
}
</style>
