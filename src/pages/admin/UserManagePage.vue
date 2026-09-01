<script setup lang="ts">
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { deleteUserUsingPost, listUserVoByPageUsingPost } from '@api/userController'
import { computed, onMounted, reactive, ref } from 'vue'

// 表格列配置：图 2 + 图 3
// title = 表头显示的文字；dataIndex = 从数据里取哪个字段
// 操作列没有对应数据字段，所以用 key
const columns = [
  { title: 'id', dataIndex: 'id' },
  { title: '账号', dataIndex: 'userAccount' },
  { title: '用户名', dataIndex: 'userName' },
  { title: '头像', dataIndex: 'userAvatar' },
  { title: '简介', dataIndex: 'userProfile' },
  { title: '用户角色', dataIndex: 'userRole' },
  { title: '创建时间', dataIndex: 'createTime' },
  { title: '更新时间', dataIndex: 'updateTime' },
  { title: '操作', key: 'action' },
]

// 数据：图 4 上半
// 存储表格要展示的数据
const dataList = ref<API.UserVO[]>([])
// 存储数据的总数
const total = ref(0)

// 搜索条件
// 定义搜索参数对象
const searchParams = reactive<API.UserQueryRequest>({
  current: 1,
  pageSize: 10,
})

// 分页参数
// 需要动态计算，所以要使用 computed
const pagination = computed(() => {
  return {
    current: searchParams.current ?? 1,
    pageSize: searchParams.pageSize ?? 10,
    total: total.value,
    showSizeChanger: true,
    showTotal: (total: number) => `共 ${total} 条`,
  }
})

// 获取数据：图 4 下半 + 图 5
// 获取数据的异步函数
const fetchData = async () => {
  const res = await listUserVoByPageUsingPost({
    ...searchParams,
  })
  if (res.data.data) {
    dataList.value = res.data.data.records ?? []
    total.value = res.data.data.total ?? 0
  } else {
    message.error('获取数据失败，' + res.data.message)
  }
}

/**
 * 表格变化时触发
 * @param page
 */
const doTableChange = (page: any) => {
  searchParams.current = page.current
  searchParams.pageSize = page.pageSize
  fetchData()
}

// 获取数据
const doSearch = () => {
  // 重置页码
  searchParams.current = 1
  fetchData()
}

// 删除数据
const doDelete = async (id?: number) => {
  if (!id) {
    return
  }
  const res = await deleteUserUsingPost({ id })
  if (res.data.code === 0) {
    message.success('删除成功')
    // 刷新数据
    fetchData()
  } else {
    message.error('删除失败')
  }
}

// 页面加载时请求一次
onMounted(() => {
  fetchData()
})
</script>

<template>
  <a-card title="用户管理">
    <a-form layout="inline" :model="searchParams" @finish="doSearch" style="margin-bottom: 16px">
      <a-form-item label="账号">
        <a-input v-model:value="searchParams.userAccount" placeholder="输入账号" />
      </a-form-item>
      <a-form-item label="用户名">
        <a-input v-model:value="searchParams.userName" placeholder="输入用户名" />
      </a-form-item>
      <a-form-item>
        <a-button type="primary" html-type="submit">搜索</a-button>
      </a-form-item>
    </a-form>
    <a-table
      :columns="columns"
      :data-source="dataList"
      :pagination="pagination"
      @change="doTableChange"
    >
      <!-- 自定义列的展示效果 -->
      <template #bodyCell="{ column, record }">
        <!-- 如果有图片，显示图片 -->
        <template v-if="column.dataIndex === 'userAvatar'">
          <a-image :src="record.userAvatar" :width="120" />
        </template>
        <!-- 用户角色，显示标签 -->
        <template v-else-if="column.dataIndex === 'userRole'">
          <div v-if="record.userRole === 'admin'">
            <a-tag color="green">管理员</a-tag>
          </div>
          <div v-else>
            <a-tag color="blue">普通用户</a-tag>
          </div>
        </template>
        <!-- 使用 dayjs 格式化时间 -->
        <template v-else-if="column.dataIndex === 'createTime'">
          {{ dayjs(record.createTime).format('YYYY-MM-DD HH:mm:ss') }}
        </template>
        <!-- 操作 -->
        <template v-else-if="column.key === 'action'">
          <a-button danger @click="doDelete(record.id)">删除</a-button>
        </template>
      </template>
    </a-table>
  </a-card>
</template>

<style scoped></style>
