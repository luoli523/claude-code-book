<script setup lang="ts">
import { ref } from 'vue'
import { withBase } from 'vitepress'

const isOpen = ref(false)
const videoSrc = withBase('/dcxj.mp4')
const videoRef = ref<HTMLVideoElement | null>(null)

function togglePlayer() {
  isOpen.value = !isOpen.value
  if (!isOpen.value && videoRef.value) {
    videoRef.value.pause()
  }
}

function closePlayer() {
  isOpen.value = false
  if (videoRef.value) videoRef.value.pause()
}
</script>

<template>
  <!-- 与 VitePress social-link 风格一致的图标按钮 -->
  <div class="vp-music-wrap">
    <button
      class="vp-music-icon-btn"
      :class="{ active: isOpen }"
      @click="togglePlayer"
      aria-label="看累了听个音乐吧"
    >
      <!-- 音符 SVG，尺寸和 VitePress icon 一致 -->
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M9 3v10.55A4 4 0 1 0 11 17V7h4V3H9z"/>
      </svg>
    </button>
    <span class="vp-music-tooltip">看累了听个音乐吧</span>
  </div>

  <!-- 右下角浮窗播放器 -->
  <Teleport to="body">
    <Transition name="player-slide">
      <div v-if="isOpen" class="vp-float-player">
        <div class="vp-float-header">
          <span>🎵 &nbsp;放松一下</span>
          <button class="vp-float-close" @click="closePlayer">✕</button>
        </div>
        <video
          ref="videoRef"
          :src="videoSrc"
          controls
          autoplay
          class="vp-float-video"
        />
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ── 图标按钮 —— 与 VitePress .VPSocialLink 风格一致 ── */
.vp-music-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.vp-music-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--vp-c-text-2);
  transition: color 0.2s, background 0.15s;
  padding: 0;
}
.vp-music-icon-btn:hover,
.vp-music-icon-btn.active {
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-soft);
}
.vp-music-icon-btn.active svg {
  animation: note-spin 1.5s linear infinite;
}

/* Tooltip */
.vp-music-tooltip {
  display: none;
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  white-space: nowrap;
  background: rgba(0, 0, 0, 0.78);
  color: #fff;
  font-size: 12px;
  padding: 5px 10px;
  border-radius: 6px;
  pointer-events: none;
  z-index: 100;
}
.vp-music-wrap:hover .vp-music-tooltip {
  display: block;
}

/* ── 浮窗播放器 ── */
.vp-float-player {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 340px;
  border-radius: 12px;
  overflow: hidden;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  z-index: 9999;
}

.vp-float-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
  font-size: 13px;
  font-weight: 500;
  color: var(--vp-c-text-1);
}
.vp-float-close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--vp-c-text-2);
  font-size: 14px;
  padding: 2px 4px;
  border-radius: 4px;
  transition: background 0.15s, color 0.15s;
}
.vp-float-close:hover {
  background: var(--vp-c-danger-soft);
  color: var(--vp-c-danger-1);
}
.vp-float-video {
  width: 100%;
  display: block;
  max-height: 240px;
  background: #000;
}

/* 入场动画 */
.player-slide-enter-active,
.player-slide-leave-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.player-slide-enter-from,
.player-slide-leave-to { opacity: 0; transform: translateY(20px) scale(0.95); }

@keyframes note-spin {
  0%   { transform: rotate(-10deg); }
  50%  { transform: rotate(10deg);  }
  100% { transform: rotate(-10deg); }
}
</style>
