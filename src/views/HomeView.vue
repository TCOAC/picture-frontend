<script setup lang="ts">
import { healthUsingGet } from '@api/mainController'

healthUsingGet().then((res: any) => {
  console.log(res)
})
</script>

<template>
  <div id="homePage">
    <h2>首页</h2>
  </div>
</template>

<style scoped></style>
