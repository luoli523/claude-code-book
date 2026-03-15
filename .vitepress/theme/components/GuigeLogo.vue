<script setup lang="ts">
import { ref } from 'vue'
import { withBase } from 'vitepress'

const showModal = ref(false)
const imgSrc = withBase('/guige.jpg')
</script>

<template>
  <!-- 点击头像弹出大图 -->
  <img
    :src="imgSrc"
    class="guige-avatar"
    alt="鬼哥"
    title="点击查看大图"
    @click.prevent.stop="showModal = true"
  />

  <!-- 全屏大图弹窗 -->
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="showModal"
        class="guige-modal-backdrop"
        @click="showModal = false"
      >
        <img :src="imgSrc" class="guige-modal-img" alt="鬼哥" />
        <span class="guige-modal-hint">点击任意位置关闭</span>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.guige-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
  display: block;
  transition: transform 0.2s, box-shadow 0.2s;
}
.guige-avatar:hover {
  transform: scale(1.08);
  box-shadow: 0 0 0 3px var(--vp-c-brand-soft);
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
