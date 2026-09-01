<template>
  <div id="basicLayout">
    <a-layout style="min-height: 100vh">
      <a-layout-header class="header"><GlobalHeader /></a-layout-header>
      <a-layout-content class="content"><router-view /></a-layout-content>
      <a-layout-footer class="footer">云图库 ©2026 by YX</a-layout-footer>
    </a-layout>
  </div>
</template>

<script setup lang="ts">
import GlobalHeader from '@/components/GlobalHeader.vue'
</script>

<style scoped>
#basicLayout {
  background: #f5f6f7;
}

#basicLayout .header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-inline: 20px;
  margin-bottom: 16px;
  color: unset;
  background: white;
}

#basicLayout .content {
  /* 内容变成居中的白色卡片 */
  width: 1200px;
  margin: 0 auto 28px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  min-height: calc(100vh - 180px);
}

#basicLayout .footer {
  background: #efefef;
  padding: 16px;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  text-align: center;
}
</style>
