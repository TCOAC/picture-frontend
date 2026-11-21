<script setup lang="ts">
import { computed, ref } from 'vue'
import { message } from 'ant-design-vue'
import { api, media, type Picture } from '@/api/gallery'

interface Selection {
  x: number
  y: number
  width: number
  height: number
}

const props = defineProps<{ open: boolean; picture: Picture }>()
const emit = defineEmits<{
  'update:open': [value: boolean]
  saved: [picture: Picture]
}>()

const selection = ref<Selection>({ x: 0.1, y: 0.1, width: 0.8, height: 0.8 })
const start = ref<{ x: number; y: number }>()
const saving = ref(false)
const imageUrl = computed(() => media(props.picture))

function point(event: PointerEvent) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  return {
    x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
    y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
  }
}

function begin(event: PointerEvent) {
  start.value = point(event)
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  selection.value = { ...start.value, width: 0, height: 0 }
}

function move(event: PointerEvent) {
  if (!start.value) return
  const end = point(event)
  selection.value = {
    x: Math.min(start.value.x, end.x),
    y: Math.min(start.value.y, end.y),
    width: Math.abs(end.x - start.value.x),
    height: Math.abs(end.y - start.value.y),
  }
}

function finish(event: PointerEvent) {
  move(event)
  start.value = undefined
}

async function save() {
  if (selection.value.width < 0.02 || selection.value.height < 0.02) {
    message.error('请拖选一个裁剪区域')
    return
  }
  saving.value = true
  try {
    const image = new Image()
    image.src = imageUrl.value
    await image.decode()

    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * selection.value.width))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * selection.value.height))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('浏览器不支持图片裁剪')
    context.fillStyle = '#fff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(
      image,
      image.naturalWidth * selection.value.x,
      image.naturalHeight * selection.value.y,
      image.naturalWidth * selection.value.width,
      image.naturalHeight * selection.value.height,
      0,
      0,
      canvas.width,
      canvas.height,
    )

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => result ? resolve(result) : reject(new Error('图片编码失败')), 'image/jpeg', 0.88)
    })
    if (blob.size > 2 * 1024 * 1024) throw new Error('裁剪结果超过 2 MB，请选择更小的区域')

    const body = new FormData()
    body.append('file', blob, `${props.picture.name}.jpg`)
    body.append('id', String(props.picture.id))
    body.append('name', props.picture.name)
    body.append('introduction', props.picture.introduction || '')
    body.append('category', props.picture.category || '')
    body.append('tags', JSON.stringify(props.picture.tags))
    const updated = await api<Picture>('/picture/upload', body)
    emit('saved', updated)
    emit('update:open', false)
    message.success('裁剪结果已保存')
  } catch (cause) {
    message.error((cause as Error).message)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <a-modal
    :open="open"
    title="裁剪图片"
    width="840px"
    ok-text="保存裁剪"
    :confirm-loading="saving"
    @ok="save"
    @cancel="emit('update:open', false)"
  >
    <p class="muted">在图片上拖动鼠标或手指选择保留区域。</p>
    <div
      class="crop-surface"
      @pointerdown="begin"
      @pointermove="move"
      @pointerup="finish"
      @pointercancel="finish"
    >
      <img :src="imageUrl" :alt="picture.name" draggable="false" />
      <div
        class="crop-selection"
        :style="{
          left: `${selection.x * 100}%`,
          top: `${selection.y * 100}%`,
          width: `${selection.width * 100}%`,
          height: `${selection.height * 100}%`,
        }"
      />
    </div>
  </a-modal>
</template>

<style scoped>
.crop-surface { position: relative; width: 100%; overflow: hidden; cursor: crosshair; touch-action: none; user-select: none; }
.crop-surface img { display: block; width: 100%; height: auto; }
.crop-selection { position: absolute; border: 2px solid #fff; box-shadow: 0 0 0 9999px #17172c70, 0 0 0 1px #5553a0; pointer-events: none; }
</style>
