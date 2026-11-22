<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { api, size, type Member, type Space } from '@/api/gallery'
import { useLoginUserStore } from '@/store/loginUser'

const store = useLoginUserStore()
const spaces = ref<Space[]>([])
const members = ref<Member[]>([])
const currentSpace = ref<Space>()
const loading = ref(false)
const saving = ref(false)
const createOpen = ref(false)
const settingsOpen = ref(false)
const membersOpen = ref(false)
const createForm = reactive({ spaceName: '', spaceType: 0 })
const editName = ref('')
const memberAccount = ref('')
const memberRole = ref('editor')

const hasPersonalSpace = computed(() => spaces.value.some((space) => space.spaceType === 0))
const hasOwnedTeamSpace = computed(() => spaces.value.some((space) =>
  space.spaceType === 1 && String(space.userId) === String(store.loginUser.id)))
const canManage = (space: Space) => space.role === 'admin' || store.loginUser.userRole === 'admin'

async function loadSpaces() {
  loading.value = true
  try {
    spaces.value = await api<Space[]>('/space/mine', undefined, 'GET')
  } catch (cause) {
    message.error((cause as Error).message)
  } finally {
    loading.value = false
  }
}

function openCreate(spaceType: number) {
  createForm.spaceName = ''
  createForm.spaceType = spaceType
  createOpen.value = true
}

async function createSpace() {
  if (!createForm.spaceName.trim()) {
    message.warning('请输入空间名称')
    return
  }
  saving.value = true
  try {
    await api('/space/add', {
      spaceName: createForm.spaceName.trim(),
      spaceType: createForm.spaceType,
    })
    createOpen.value = false
    message.success('空间已创建')
    await loadSpaces()
  } catch (cause) {
    message.error((cause as Error).message)
  } finally {
    saving.value = false
  }
}

function openSettings(space: Space) {
  currentSpace.value = space
  editName.value = space.spaceName
  settingsOpen.value = true
}

async function saveSettings() {
  if (!currentSpace.value || !editName.value.trim()) {
    message.warning('请输入空间名称')
    return
  }
  saving.value = true
  try {
    await api('/space/edit', { id: currentSpace.value.id, spaceName: editName.value.trim() })
    settingsOpen.value = false
    message.success('空间已更新')
    await loadSpaces()
  } catch (cause) {
    message.error((cause as Error).message)
  } finally {
    saving.value = false
  }
}

async function deleteSpace() {
  if (!currentSpace.value) return
  saving.value = true
  try {
    await api('/space/delete', { id: currentSpace.value.id })
    settingsOpen.value = false
    message.success('空间已删除')
    await loadSpaces()
  } catch (cause) {
    message.error((cause as Error).message)
  } finally {
    saving.value = false
  }
}

async function loadMembers() {
  if (!currentSpace.value) return
  try {
    members.value = await api<Member[]>('/space/members', { id: currentSpace.value.id }, 'GET')
  } catch (cause) {
    message.error((cause as Error).message)
  }
}

async function openMembers(space: Space) {
  currentSpace.value = space
  memberAccount.value = ''
  membersOpen.value = true
  await loadMembers()
}

async function addMember() {
  if (!currentSpace.value || !memberAccount.value.trim()) {
    message.warning('请输入成员账号')
    return
  }
  saving.value = true
  try {
    await api('/space/member', {
      id: currentSpace.value.id,
      userAccount: memberAccount.value.trim(),
      spaceRole: memberRole.value,
    })
    memberAccount.value = ''
    message.success('成员已添加')
    await loadMembers()
  } catch (cause) {
    message.error((cause as Error).message)
  } finally {
    saving.value = false
  }
}

async function updateRole(member: Member, spaceRole: string) {
  if (!currentSpace.value || member.spaceRole === spaceRole) return
  try {
    await api('/space/member', { id: currentSpace.value.id, userId: member.userId, spaceRole })
    message.success('权限已更新')
    await loadMembers()
  } catch (cause) {
    message.error((cause as Error).message)
  }
}

async function removeMember(member: Member) {
  if (!currentSpace.value) return
  try {
    await api('/space/member/delete', { id: currentSpace.value.id, userId: member.userId })
    message.success('成员已移除')
    await loadMembers()
  } catch (cause) {
    message.error((cause as Error).message)
  }
}

onMounted(loadSpaces)
</script>

<template>
  <div class="page-heading">
    <span class="eyebrow">YOUR WORKSPACES</span>
    <h1>每个灵感，都有自己的空间。</h1>
    <p class="muted">创建个人或团队图库，邀请伙伴一起管理素材。</p>
  </div>
  <div class="space-actions">
    <a-button :disabled="hasPersonalSpace" @click="openCreate(0)">＋ 新建个人空间</a-button>
    <a-button type="primary" :disabled="hasOwnedTeamSpace" @click="openCreate(1)">＋ 新建团队空间</a-button>
  </div>
  <a-spin :spinning="loading">
    <div class="spaces-grid">
      <article v-for="space in spaces" :key="space.id" class="space-card">
        <div class="space-symbol">{{ space.spaceType === 1 ? '✦' : '▤' }}</div>
        <span class="eyebrow">{{ space.spaceType === 1 ? 'TEAM SPACE' : 'PERSONAL SPACE' }} · LEVEL {{ space.spaceLevel }}</span>
        <h2>{{ space.spaceName }}</h2>
        <p>{{ space.totalCount }} 张图片 · {{ size(space.totalSize) }} 已用 · {{ space.role }}</p>
        <div class="space-progress">
          <span :style="{ width: Math.min(100, Number(space.totalSize) / Math.max(1, Number(space.maxSize)) * 100) + '%' }" />
        </div>
        <a-space wrap>
          <RouterLink :to="'/space/' + space.id"><a-button type="primary">打开图库</a-button></RouterLink>
          <a-button v-if="space.spaceType === 1" @click="openMembers(space)">团队成员</a-button>
          <RouterLink :to="'/analysis?spaceId=' + space.id"><a-button>分析</a-button></RouterLink>
          <a-button v-if="canManage(space)" @click="openSettings(space)">设置</a-button>
        </a-space>
      </article>
    </div>
    <a-empty v-if="!loading && !spaces.length" description="还没有空间。创建一个，开始整理你的图库吧。" />
  </a-spin>

  <a-modal v-model:open="createOpen" :title="createForm.spaceType === 1 ? '新建团队空间' : '新建个人空间'" :confirm-loading="saving" @ok="createSpace">
    <a-form layout="vertical">
      <a-form-item label="空间名称"><a-input v-model:value="createForm.spaceName" :maxlength="128" placeholder="输入空间名称" /></a-form-item>
    </a-form>
  </a-modal>

  <a-modal v-model:open="settingsOpen" title="空间设置" :confirm-loading="saving" @ok="saveSettings">
    <a-form layout="vertical">
      <a-form-item label="空间名称"><a-input v-model:value="editName" :maxlength="128" /></a-form-item>
    </a-form>
    <a-popconfirm title="只能删除空空间。确定删除吗？" ok-text="删除" cancel-text="取消" @confirm="deleteSpace">
      <a-button danger :loading="saving">删除空间</a-button>
    </a-popconfirm>
  </a-modal>

  <a-modal v-model:open="membersOpen" :title="(currentSpace?.spaceName || '') + ' · 团队成员'" :footer="null" width="640px">
    <a-form v-if="currentSpace && canManage(currentSpace)" layout="inline" class="member-form">
      <a-form-item><a-input v-model:value="memberAccount" placeholder="成员登录账号" aria-label="成员登录账号" /></a-form-item>
      <a-form-item>
        <a-select v-model:value="memberRole" aria-label="成员权限" style="width: 110px" :options="[
          { label: '查看', value: 'viewer' },
          { label: '编辑', value: 'editor' },
          { label: '管理', value: 'admin' },
        ]" />
      </a-form-item>
      <a-form-item><a-button type="primary" :loading="saving" @click="addMember">添加成员</a-button></a-form-item>
    </a-form>
    <a-list :data-source="members" class="member-list">
      <template #renderItem="{ item }">
        <a-list-item>
          <template #actions>
            <a-select
              v-if="currentSpace && canManage(currentSpace) && String(item.userId) !== String(currentSpace.userId)"
              :value="item.spaceRole"
              aria-label="调整成员权限"
              style="width: 100px"
              :options="[
                { label: '查看', value: 'viewer' },
                { label: '编辑', value: 'editor' },
                { label: '管理', value: 'admin' },
              ]"
              @change="updateRole(item, String($event))"
            />
            <a-popconfirm
              v-if="currentSpace && canManage(currentSpace) && String(item.userId) !== String(currentSpace.userId)"
              title="确定移除这位成员吗？"
              ok-text="移除"
              cancel-text="取消"
              @confirm="removeMember(item)"
            ><a class="danger-action">移除</a></a-popconfirm>
          </template>
          <a-list-item-meta :description="'用户 ID ' + item.userId">
            <template #title>{{ item.userName || '用户 ' + item.userId }}</template>
            <template #avatar><a-avatar :src="item.userAvatar">{{ (item.userName || '用').slice(0, 1) }}</a-avatar></template>
          </a-list-item-meta>
          <a-tag v-if="String(item.userId) === String(currentSpace?.userId)">创建者</a-tag>
        </a-list-item>
      </template>
    </a-list>
  </a-modal>
</template>

<style scoped>
.member-form { margin-bottom: 20px; }
.member-list { max-height: 420px; overflow-y: auto; }
.danger-action { color: #c94c4c; }
</style>
