<template>
  <button
    class="sidebar-toggle-btn"
    :class="{ collapsed }"
    :title="collapsed ? '展开目录' : '收起目录'"
    @click="toggle"
  >
    <span class="sidebar-toggle-icon">{{ collapsed ? '›' : '‹' }}</span>
  </button>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const collapsed = ref(false)
const STORAGE_KEY = 'sidebar-collapsed'

function toggle() {
  collapsed.value = !collapsed.value
  document.documentElement.classList.toggle('sidebar-collapsed', collapsed.value)
  localStorage.setItem(STORAGE_KEY, collapsed.value ? '1' : '0')
}

onMounted(() => {
  if (localStorage.getItem(STORAGE_KEY) === '1') {
    collapsed.value = true
    document.documentElement.classList.add('sidebar-collapsed')
  }
})
</script>

<style scoped>
.sidebar-toggle-btn {
  position: fixed;
  top: 50%;
  left: calc(var(--vp-sidebar-width, 272px) - 14px);
  transform: translateY(-50%);
  z-index: 30;
  width: 24px;
  height: 48px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 0 6px 6px 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: left 0.3s ease, background 0.2s;
  box-shadow: 2px 0 6px rgba(0, 0, 0, 0.08);
}

.sidebar-toggle-btn:hover {
  background: var(--vp-c-bg-mute);
}

.sidebar-toggle-btn.collapsed {
  left: -1px;
}

.sidebar-toggle-icon {
  font-size: 16px;
  color: var(--vp-c-text-2);
  line-height: 1;
  pointer-events: none;
}
</style>
