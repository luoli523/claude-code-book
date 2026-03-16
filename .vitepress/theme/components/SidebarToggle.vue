<template>
  <Teleport to="body">
    <button
      class="sidebar-toggle-btn"
      :class="{ collapsed }"
      :title="collapsed ? '展开目录' : '收起目录'"
      @click="toggle"
    >
      <span class="sidebar-toggle-icon">{{ collapsed ? '▶' : '◀' }}</span>
      <span class="sidebar-toggle-label">{{ collapsed ? '目录' : '收起' }}</span>
    </button>
  </Teleport>
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
  top: 30%;
  left: calc(var(--vp-sidebar-width, 272px) - 1px);
  transform: translateY(-50%);
  z-index: 100;
  width: 28px;
  height: 56px;
  padding: 0;
  background: var(--vp-c-brand-1);
  border: none;
  border-radius: 0 8px 8px 0;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  transition: left 0.3s ease, background 0.2s, opacity 0.2s;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  opacity: 0.75;
}

.sidebar-toggle-btn:hover {
  opacity: 1;
  background: var(--vp-c-brand-2);
}

.sidebar-toggle-btn.collapsed {
  left: 0;
}

.sidebar-toggle-icon {
  font-size: 10px;
  color: #fff;
  line-height: 1;
}

.sidebar-toggle-label {
  font-size: 10px;
  color: #fff;
  line-height: 1;
  writing-mode: vertical-rl;
  letter-spacing: 1px;
}

/* 小屏不显示 */
@media (max-width: 959px) {
  .sidebar-toggle-btn {
    display: none;
  }
}
</style>
