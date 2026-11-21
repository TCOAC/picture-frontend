<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { api, size, type Space } from '@/api/gallery'

const spaces = ref<Space[]>([])
const loading = ref(false)
const error = ref('')
const search = ref('')
const editing = ref<Space>()
const editorOpen = ref(false)
const form = reactive({ spaceName: '', spaceLevel: 0 })

const filtered = computed(() => {
  const keyword = search.value.trim().toLowerCase()
  return keyword
    ? spaces.value.filter((space) => space.spaceName.toLowerCase().includes(keyword))
    : spaces.value
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    spaces.value = await api<Space[]>('/space/list', undefined, 'GET')
  } catch (cause) {
    error.value = (cause as Error).message
  } finally {
    loading.value = false
  }
}

function openEditor(space: Space) {
  editing.value = space
  form.spaceName = space.spaceName
  form.spaceLevel = space.spaceLevel
  editorOpen.value = true
}

async function save() {
  if (!editing.value) return
  try {
    await api('/space/edit', {
      id: editing.value.id,
      spaceName: form.spaceName,
      spaceLevel: form.spaceLevel,
    })
    editorOpen.value = false
    message.success('空间已更新')
    await load()
  } catch (cause) {
    message.error((cause as Error).message)
  }
}

async function remove(space: Space) {
  try {
    await api('/space/delete', { id: space.id })
    message.success('空间已删除')
    await load()
  } catch (cause) {
    message.error((cause as Error).message)
  }
}

onMounted(load)
</script>

<template>
  <div class="page-heading">
    <h1>空间管理</h1>
    <p class="muted">查看空间用量，调整等级和配额。</p>
  </div>

  <section class="panel">
    <a-input-search v-model:value="search" placeholder="按空间名称筛选" allow-clear />
    <a-alert v-if="error" class="mb" type="error" :message="error" show-icon />
    <a-table :data-source="filtered" :loading="loading" row-key="id" :pagination="{ pageSize: 20 }">
      <a-table-column title="空间" data-index="spaceName" key="spaceName" />
      <a-table-column title="类型" key="spaceType">
        <template #default="{ record }">{{ record.spaceType === 1 ? '团队' : '个人' }}</template>
      </a-table-column>
      <a-table-column title="等级" data-index="spaceLevel" key="spaceLevel" />
      <a-table-column title="所有者 ID" data-index="userId" key="userId" />
      <a-table-column title="图片用量" key="count">
        <template #default="{ record }">{{ record.totalCount }} / {{ record.maxCount }}</template>
      </a-table-column>
      <a-table-column title="存储用量" key="size">
        <template #default="{ record }">{{ size(record.totalSize) }} / {{ size(record.maxSize) }}</template>
      </a-table-column>
      <a-table-column title="操作" key="actions">
        <template #default="{ record }">
          <a-space>
            <RouterLink :to="`/space/${record.id}`">打开</RouterLink>
            <a @click="openEditor(record)">编辑</a>
            <a-popconfirm
              title="确定删除这个空空间吗？"
              ok-text="删除"
              cancel-text="取消"
              @confirm="remove(record)"
            >
              <a class="danger-action">删除</a>
            </a-popconfirm>
          </a-space>
        </template>
      </a-table-column>
    </a-table>
  </section>

  <a-modal v-model:open="editorOpen" title="编辑空间" ok-text="保存" @ok="save">
    <a-form layout="vertical">
      <a-form-item label="空间名称">
        <a-input v-model:value="form.spaceName" :maxlength="128" />
      </a-form-item>
      <a-form-item label="空间等级">
        <a-select
          v-model:value="form.spaceLevel"
          :options="[
            { label: '普通版', value: 0 },
            { label: '专业版', value: 1 },
            { label: '旗舰版', value: 2 },
          ]"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<style scoped>
.panel > .ant-input-search { max-width: 320px; margin-bottom: 20px; }
.danger-action { color: #c94c4c; }
</style>
