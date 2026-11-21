<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { api, size, type Space } from '@/api/gallery'

interface Metric {
  label: string | null
  count: number | string
  size?: number | string
}

interface Analysis {
  summary: {
    pictureCount: number | string
    totalSize: number | string
    views: number | string
    downloads: number | string
  }
  categories: Metric[]
  formats: Metric[]
  tags: Metric[]
  sizes: Metric[]
  daily: Metric[]
  contributors: Metric[]
  analyzedPictures: number
  spaceRank?: Space[]
}

const route = useRoute()
const analysis = ref<Analysis>()
const error = ref('')
const loading = ref(false)
const days = computed(() => [...(analysis.value?.daily ?? [])].reverse())
const largestDay = computed(() => Math.max(1, ...days.value.map((day) => Number(day.count))))

async function load() {
  loading.value = true
  error.value = ''
  const rawId = route.query.spaceId
  const spaceId = Array.isArray(rawId) ? rawId[0] : rawId
  try {
    analysis.value = await api<Analysis>('/space/analyze', spaceId ? { spaceId } : undefined, 'GET')
  } catch (cause) {
    analysis.value = undefined
    error.value = (cause as Error).message
  } finally {
    loading.value = false
  }
}

watch(() => route.fullPath, load, { immediate: true })
</script>

<template>
  <div class="page-heading">
    <h1>空间分析</h1>
    <p class="muted">查看图片、容量和团队使用情况。</p>
  </div>
  <a-alert v-if="error" type="error" :message="error" show-icon />
  <a-spin :spinning="loading">
    <div v-if="analysis" class="stat-grid">
      <article class="stat-card"><span>图片总数</span><strong>{{ analysis.summary.pictureCount }}</strong></article>
      <article class="stat-card"><span>存储容量</span><strong>{{ size(analysis.summary.totalSize) }}</strong></article>
      <article class="stat-card"><span>浏览总量</span><strong>{{ analysis.summary.views }}</strong></article>
      <article class="stat-card"><span>下载总量</span><strong>{{ analysis.summary.downloads }}</strong></article>

      <section class="panel">
        <h2>分类</h2>
        <a-list :data-source="analysis.categories">
          <template #renderItem="{ item }">
            <a-list-item>{{ item.label || '未分类' }} <a-tag>{{ item.count }} 张</a-tag> {{ size(item.size || 0) }}</a-list-item>
          </template>
        </a-list>
      </section>
      <section class="panel">
        <h2>标签</h2>
        <a-list :data-source="analysis.tags">
          <template #renderItem="{ item }"><a-list-item>{{ item.label }} <a-tag>{{ item.count }} 张</a-tag></a-list-item></template>
        </a-list>
      </section>
      <section class="panel">
        <h2>文件格式</h2>
        <a-list :data-source="analysis.formats">
          <template #renderItem="{ item }"><a-list-item>{{ item.label?.toUpperCase() || '未知' }} <a-tag>{{ item.count }} 张</a-tag></a-list-item></template>
        </a-list>
      </section>
      <section class="panel">
        <h2>文件体积</h2>
        <a-list :data-source="analysis.sizes">
          <template #renderItem="{ item }"><a-list-item>{{ item.label }} <a-tag>{{ item.count }} 张</a-tag></a-list-item></template>
        </a-list>
      </section>
      <section class="panel">
        <h2>最近 30 天上传</h2>
        <div class="bars">
          <div
            v-for="day in days"
            :key="day.label || ''"
            :title="`${day.label}: ${day.count} 张`"
            :style="{ height: `${Math.max(5, Number(day.count) / largestDay * 100)}%` }"
          />
        </div>
        <p v-if="days.length" class="muted">{{ days[0]?.label }} — {{ days[days.length - 1]?.label }}</p>
      </section>
      <section class="panel">
        <h2>上传者</h2>
        <a-list :data-source="analysis.contributors">
          <template #renderItem="{ item }"><a-list-item>用户 {{ item.label }} <a-tag>{{ item.count }} 张</a-tag></a-list-item></template>
        </a-list>
      </section>
      <section v-if="analysis.spaceRank" class="panel">
        <h2>空间容量排行</h2>
        <a-list :data-source="analysis.spaceRank">
          <template #renderItem="{ item }">
            <a-list-item><RouterLink :to="`/space/${item.id}`">{{ item.spaceName }}</RouterLink> <a-tag>{{ size(item.totalSize) }}</a-tag></a-list-item>
          </template>
        </a-list>
      </section>
    </div>
  </a-spin>
</template>
