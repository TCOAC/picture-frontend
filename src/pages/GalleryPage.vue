<script setup lang="ts">
import { computed, ref, reactive, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useLoginUserStore } from '@/store/loginUser'
import { message } from 'ant-design-vue'
import { api, media, size, status, searchByColor, type Picture, type Page, type Id, type Space } from '@/api/gallery'
const route = useRoute()
const loginUserStore=useLoginUserStore()
const pictures = ref<Picture[]>([]), loading = ref(false), error = ref(''), total = ref(0), selected = ref<Id[]>([])
const query = reactive({ searchText: '', category: '', tag: '', current: 1, pageSize: 24, reviewStatus: undefined as number | undefined, minWidth: undefined as number | undefined, minHeight: undefined as number | undefined, picFormat: undefined as string | undefined, sortField: 'createTime', sortOrder: 'descend' })
const space = ref<Space>(), role = ref(''), color = ref('#6d76dc'), searchNote = ref(''), batchOpen = ref(false), batchCategory = ref(''), batchTags = ref(''), batchNameRule = ref('')
const categoryOptions = ref<string[]>([])
const tagOptions = ref<string[]>([])
const mode = computed(() => route.path.startsWith('/space/') ? 'space' : route.path.startsWith('/admin/') ? 'admin' : route.path === '/my' ? 'my' : 'public')
const canEdit = computed(() => mode.value === 'my' || mode.value === 'admin' || (mode.value === 'space' && ['admin', 'editor'].includes(role.value)))
const title = computed(() => mode.value === 'space' ? space.value?.spaceName || '空间图库' : mode.value === 'admin' ? '图片审核' : mode.value === 'my' ? '我的作品' : '让好图片，找到它的位置。')
async function load() {
  loading.value = true; error.value = ''; searchNote.value = ''; selected.value = []
  try {
    if (mode.value === 'space') { const info = await api<{ space: Space; role: string }>('/space/get/vo', { id: route.params.id }, 'GET'); space.value = info.space; role.value = info.role }
    const path = mode.value === 'public' ? '/picture/list/page/vo' : mode.value === 'space' ? '/picture/space/list/page/vo' : `/picture/${mode.value === 'admin' ? 'admin' : mode.value}/list/page/vo`
    const page = await api<Page<Picture>>(path, { ...query, spaceId: mode.value === 'space' ? route.params.id : undefined })
    pictures.value = page.records; total.value = Number(page.total)
  } catch (e) { error.value = (e as Error).message } finally { loading.value = false }
}
async function colorSearch() {
  loading.value = true
  try { pictures.value = await searchByColor(color.value, mode.value === 'space' ? String(route.params.id) : undefined); total.value = pictures.value.length; searchNote.value = '按颜色接近程度排序'; selected.value = [] } catch (e) { message.error((e as Error).message) } finally { loading.value = false }
}
async function review(p: Picture, reviewStatus: number) {
  const reviewMessage = reviewStatus === 2 ? window.prompt('驳回原因', '请补充图片信息') : '审核通过'
  if (reviewMessage === null) return
  try { await api('/picture/review', { id: p.id, reviewStatus, reviewMessage }); message.success('已更新审核结果'); await load() } catch (e) { message.error((e as Error).message) }
}
function toggle(id: Id, checked: boolean) { selected.value = checked ? [...selected.value, id] : selected.value.filter(x => x !== id) }
async function batchSave() { try { await api('/picture/batch/edit', { ids: selected.value, category: batchCategory.value || undefined, tags: batchTags.value.trim() ? batchTags.value.split(/[,，]/).map(x => x.trim()).filter(Boolean) : undefined, nameRule: batchNameRule.value || undefined }); batchOpen.value = false; message.success('批量编辑成功'); await load() } catch (e) { message.error((e as Error).message) } }
onMounted(async () => {
  try {
    const suggestions = await api<{ categoryList: string[]; tagList: string[] }>('/picture/tag_category', undefined, 'GET')
    categoryOptions.value = suggestions.categoryList ?? []
    tagOptions.value = suggestions.tagList ?? []
  } catch {
    // Free-text filtering remains available if suggestions cannot load.
  }
})
watch(() => route.fullPath, () => { query.current = 1; query.reviewStatus = undefined; load() }, { immediate: true })
</script>

<template>
  <section class="gallery-hero" :class="{ compact: mode !== 'public' }">
    <div><span class="eyebrow">CLOUD GALLERY / {{ mode === 'public' ? 'EXPLORE' : mode.toUpperCase() }}</span><h1>{{ title }}</h1><p>{{ mode === 'public' ? '收藏灵感、管理素材，与团队一起创造。' : mode === 'space' ? `已用 ${size(space?.totalSize || 0)} / ${size(space?.maxSize || 0)} · ${space?.totalCount} / ${space?.maxCount} 张 · ${role}` : '从上传到分享，让每一份创作井然有序。' }}</p></div>
    <div class="hero-actions"><RouterLink v-if="mode === 'space'" :to="`/analysis?spaceId=${route.params.id}`"><a-button>空间分析</a-button></RouterLink><RouterLink v-if="loginUserStore.loginUser.id && (mode !== 'space' || canEdit)" :to="{ path: '/upload', query: { spaceId: mode === 'space' ? String(route.params.id) : undefined } }"><a-button type="primary" size="large">＋ 上传图片</a-button></RouterLink></div>
  </section>
  <div class="filter-panel">
    <a-input-search v-model:value="query.searchText" placeholder="搜索名称或简介，发现更多灵感" enter-button="搜索" size="large" @search="query.current = 1; load()" />
    <div class="filter-row">
      <a-auto-complete v-model:value="query.category" placeholder="分类" aria-label="分类" allow-clear :options="categoryOptions.map(value => ({ value }))" /><a-auto-complete v-model:value="query.tag" placeholder="标签" aria-label="标签" allow-clear :options="tagOptions.map(value => ({ value }))" />
      <a-select v-model:value="query.picFormat" placeholder="所有格式" allow-clear :options="['jpg','png','webp'].map(x=>({ label: x.toUpperCase(), value: x }))" />
      <a-input-number v-model:value="query.minWidth" :min="1" placeholder="最小宽度" aria-label="最小宽度" /><a-input-number v-model:value="query.minHeight" :min="1" placeholder="最小高度" aria-label="最小高度" />
      <a-select v-if="mode === 'my' || mode === 'admin'" v-model:value="query.reviewStatus" placeholder="全部状态" allow-clear :options="status.map((x,i)=>({ label:x,value:i }))" />
      <a-select v-model:value="query.sortField" :options="[{label:'最近上传',value:'createTime'},{label:'最近编辑',value:'editTime'},{label:'文件大小',value:'picSize'}]" />
      <a-button @click="query.current = 1; load()">应用筛选</a-button>
      <label v-if="mode === 'public' || mode === 'space'" class="color-filter"><input v-model="color" type="color" aria-label="检索颜色" /><a-button type="text" @click="colorSearch">按颜色找图</a-button></label>
    </div>
  </div>
  <div class="section-title"><h2>{{ mode === 'public' ? '精选图库' : '图片列表' }} <small>{{ total }} 张</small></h2><a-button v-if="canEdit" :disabled="selected.length === 0" @click="batchOpen = true">批量编辑 ({{ selected.length }})</a-button></div>
  <p v-if="searchNote" class="muted">{{ searchNote }} <a @click="load">恢复列表</a></p>
  <a-alert v-if="error" type="error" :message="error" show-icon><template #action><a-button @click="load">重试</a-button></template></a-alert>
  <a-spin :spinning="loading"><div v-if="pictures.length" class="picture-grid">
    <article v-for="p in pictures" :key="p.id" class="picture-card">
      <div class="card-image"><RouterLink :to="`/picture/${p.id}`"><img :src="media(p,true)" :alt="p.name" loading="lazy" /></RouterLink><a-checkbox v-if="canEdit" class="select-picture" :checked="selected.includes(p.id)" :aria-label="`选择 ${p.name}`" @change="toggle(p.id,($event as any).target.checked)" /><span v-if="mode !== 'public'" class="status-badge" :class="`status-${p.reviewStatus}`">{{ status[p.reviewStatus] }}</span></div>
      <div class="card-info"><RouterLink :to="`/picture/${p.id}`"><h3>{{ p.name }}</h3></RouterLink><p>{{ p.user?.userName || '创作者' }} <span>{{ p.picWidth }} × {{ p.picHeight }}</span></p><div class="tags"><a-tag v-for="tag in p.tags?.slice(0,3)" :key="tag">{{ tag }}</a-tag><a-tag v-if="p.category" color="blue">{{ p.category }}</a-tag></div><p v-if="p.reviewStatus === 2" class="reject-reason">{{ p.reviewMessage }}</p><a-space v-if="mode === 'admin'"><a-button size="small" @click="review(p,1)">通过</a-button><a-button size="small" danger @click="review(p,2)">驳回</a-button></a-space></div>
    </article>
  </div><a-empty v-else-if="!loading && !error" description="暂无图片，试试调整筛选或上传第一张作品" /></a-spin>
  <a-pagination v-if="total > query.pageSize && !searchNote" v-model:current="query.current" :total="total" :page-size="query.pageSize" :show-size-changer="false" class="pagination" @change="load()" />
  <a-modal v-model:open="batchOpen" title="批量编辑图片" @ok="batchSave"><a-form layout="vertical"><a-form-item label="分类"><a-input v-model:value="batchCategory" :maxlength="64" /></a-form-item><a-form-item label="标签（逗号分隔）"><a-input v-model:value="batchTags" /></a-form-item><a-form-item label="名称规则"><a-input v-model:value="batchNameRule" placeholder="图片{序号}" :maxlength="120" /></a-form-item></a-form></a-modal>
</template>
