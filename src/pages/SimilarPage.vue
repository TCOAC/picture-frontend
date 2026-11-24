<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import { api, media, searchExternalByPicture, type ExternalImageSearchResult, type Picture } from '@/api/gallery'

const route = useRoute()
const pics = ref<Picture[]>([])
const external = ref<ExternalImageSearchResult[]>([])
const busy = ref(false)
const externalBusy = ref(false)
const externalAvailable = ref(false)
const note = ref('')
const externalNote = ref('')

async function loadSimilar() {
  busy.value = true
  try {
    const source = await api<Picture>(`/picture/get/vo?id=${route.params.id}`, undefined, 'GET')
    externalAvailable.value = !source.spaceId && source.reviewStatus === 1
    const data = await api<{ records: Picture[]; searched: number; total: number }>(
      '/picture/search/similar',
      { pictureId: route.params.id },
    )
    pics.value = data.records
    note.value = `比较 ${data.searched} 张图片（共 ${data.total} 张）`
  } catch (cause) {
    message.error((cause as Error).message)
  } finally {
    busy.value = false
  }
}

async function loadExternal() {
  externalBusy.value = true
  externalNote.value = ''
  try {
    external.value = await searchExternalByPicture(String(route.params.id))
    externalNote.value = `外部搜索返回 ${external.value.length} 条结果`
  } catch (cause) {
    externalNote.value = (cause as Error).message
    message.error((cause as Error).message)
  } finally {
    externalBusy.value = false
  }
}

onMounted(loadSimilar)
</script>

<template>
  <div class="page-heading">
    <span class="eyebrow">DISCOVER / SIMILARITY</span>
    <h1>相似的灵感</h1>
    <p>{{ note }}</p>
    <a-button :loading="externalBusy" :disabled="!externalAvailable" @click="loadExternal">外部以图搜图</a-button>
    <p v-if="!externalAvailable" class="muted">外部搜索仅支持已审核公开图片</p>
    <p v-if="externalNote" class="muted">{{ externalNote }}</p>
  </div>
  <a-spin :spinning="busy">
    <div class="picture-grid">
      <article v-for="picture in pics" :key="picture.id" class="picture-card">
        <RouterLink :to="`/picture/${picture.id}`"><img class="similar-image" :src="media(picture, true)" :alt="picture.name" /><h3>{{ picture.name }}</h3></RouterLink>
      </article>
    </div>
  </a-spin>
  <section v-if="external.length" class="external-results">
    <h2>外部搜索结果</h2>
    <div class="external-grid">
      <a v-for="(result, index) in external" :key="`${result.fromUrl}-${index}`" class="external-card" :href="result.fromUrl" target="_blank" rel="noopener noreferrer">
        <img v-if="result.thumbUrl" :src="result.thumbUrl" :alt="result.title || '外部图片'" loading="lazy" />
        <span>{{ result.title || result.fromUrl }}</span>
      </a>
    </div>
  </section>
</template>

<style scoped>
.external-results { margin-top: 36px; }
.external-results h2 { margin-bottom: 16px; }
.external-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 14px; }
.external-card { overflow: hidden; display: flex; flex-direction: column; gap: 8px; padding-bottom: 10px; background: white; border: 1px solid #efeff4; border-radius: 12px; }
.external-card img { width: 100%; height: 140px; object-fit: cover; background: #f4f4f8; }
.external-card span { padding: 0 10px; overflow: hidden; color: #696a78; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
@media (max-width: 720px) { .external-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
