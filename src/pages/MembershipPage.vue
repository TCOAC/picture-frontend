<script setup lang="ts">
import { computed, ref } from 'vue'
import { message } from 'ant-design-vue'
import { api } from '@/api/gallery'
import { useLoginUserStore } from '@/store/loginUser'

const account = useLoginUserStore()
const vipCode = ref('')
const durationDays = ref(30)
const issuedCode = ref('')
const redeeming = ref(false)
const issuing = ref(false)

const expiry = computed(() => account.loginUser.vipExpireTime)
const active = computed(() => Boolean(expiry.value && new Date(expiry.value).getTime() > Date.now()))

async function redeem() {
  if (!vipCode.value.trim()) {
    message.error('请输入兑换码')
    return
  }
  redeeming.value = true
  try {
    const user = await api<API.LoginUserVO>('/user/exchange/vip', { vipCode: vipCode.value.trim() })
    account.setLoginUser(user)
    vipCode.value = ''
    message.success('兑换成功')
  } catch (error) {
    message.error(error instanceof Error ? error.message : '兑换失败')
  } finally {
    redeeming.value = false
  }
}

async function issue() {
  issuing.value = true
  issuedCode.value = ''
  try {
    issuedCode.value = await api<string>('/user/vip/issue', { durationDays: durationDays.value })
    message.success('兑换码已生成，请复制并妥善保存')
  } catch (error) {
    message.error(error instanceof Error ? error.message : '生成失败')
  } finally {
    issuing.value = false
  }
}
</script>

<template>
  <main class="membership-page">
    <a-card title="我的会员">
      <p v-if="active">有效期至 {{ new Date(expiry!).toLocaleString('zh-CN') }}</p>
      <p v-else>当前没有有效会员</p>
      <a-form layout="vertical">
        <a-form-item label="兑换码">
          <a-input v-model:value="vipCode" placeholder="VIP- 开头的兑换码" :maxlength="36" autocomplete="off" @press-enter="redeem" />
        </a-form-item>
        <a-button type="primary" :loading="redeeming" @click="redeem">兑换会员</a-button>
      </a-form>
    </a-card>

    <a-card v-if="account.loginUser.userRole === 'admin'" title="生成兑换码">
      <a-form layout="vertical">
        <a-form-item label="有效天数">
          <a-input-number v-model:value="durationDays" :min="1" :max="365" :precision="0" />
        </a-form-item>
        <a-button :loading="issuing" @click="issue">生成兑换码</a-button>
      </a-form>
      <a-alert v-if="issuedCode" class="issued-code" type="success" message="兑换码仅在此处显示一次" />
      <a-typography-paragraph v-if="issuedCode" :copyable="{ text: issuedCode }">
        {{ issuedCode }}
      </a-typography-paragraph>
    </a-card>
  </main>
</template>

<style scoped>
.membership-page { max-width: 680px; margin: 24px auto; display: grid; gap: 20px; }
.issued-code { margin-top: 20px; margin-bottom: 12px; }
</style>
