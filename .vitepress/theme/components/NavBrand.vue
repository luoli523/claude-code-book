<script setup lang="ts">
import { ref } from 'vue'
import { withBase } from 'vitepress'

const showModal = ref(false)
const imgSrc = withBase('/guige.jpg')
</script>

<template>
  <div class="nav-brand">
    <img
      :src="imgSrc"
      class="nav-brand-avatar"
      alt="鬼哥"
      title="点击查看大图"
      @click="showModal = true"
    />
    <span class="nav-brand-title">跟鬼哥玩转 Claude Code</span>
  </div>

  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="showModal" class="guige-modal-backdrop" @click="showModal = false">
        <img :src="imgSrc" class="guige-modal-img" alt="鬼哥" />
        <span class="guige-modal-hint">点击任意位置关闭</span>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.nav-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 16px;
  flex-shrink: 0;
}

.nav-brand-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
  border: 2px solid var(--vp-c-brand-1);
  transition: transform 0.2s, box-shadow 0.2s;
  flex-shrink: 0;
}
.nav-brand-avatar:hover {
  transform: scale(1.1);
  box-shadow: 0 0 0 3px var(--vp-c-brand-soft);
}

.nav-brand-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  white-space: nowrap;
}

.guige-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  cursor: pointer;
  backdrop-filter: blur(4px);
}
.guige-modal-img {
  max-width: min(80vw, 600px);
  max-height: 80vh;
  border-radius: 12px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5);
  object-fit: contain;
}
.guige-modal-hint {
  margin-top: 16px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
}

.modal-fade-enter-active,
.modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from,
.modal-fade-leave-to { opacity: 0; }
</style>
