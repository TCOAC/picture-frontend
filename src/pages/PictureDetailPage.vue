<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { api, media, size, status, type Picture } from '@/api/gallery'
import { useLoginUserStore } from '@/store/loginUser'
import ImageCropper from '@/components/ImageCropper.vue'
const route=useRoute(),router=useRouter(),store=useLoginUserStore()
const picture=ref<Picture>(),busy=ref(false),editing=ref(false),sharing=ref(false),aiOpen=ref(false),outpaintOpen=ref(false),cropOpen=ref(false),aiPrompt=ref(''),outpaintPrompt=ref(''),outpaintScale=ref(1.5),shareUrl=ref(''),collab=ref<WebSocket>(),connected=ref(false),lock=ref(false),rotation=ref(0),flip=ref(false),note=ref(''),spaceRole=ref(''),spaceType=ref(0),heartbeat=ref<number>()
const canEdit=computed(()=>picture.value && (picture.value.spaceId
  ? ['admin', 'editor'].includes(spaceRole.value)
  : store.loginUser.userRole === 'admin' || String(picture.value.userId) === String(store.loginUser.id)))
const form=ref({name:'',introduction:'',category:'',tags:''})
async function load(){try{const code=route.query.code;picture.value=await api<Picture>(`/picture/get/vo?id=${route.params.id}${code?`&code=${encodeURIComponent(String(code))}`:''}`,undefined,'GET');form.value={name:picture.value.name,introduction:picture.value.introduction||'',category:picture.value.category||'',tags:picture.value.tags.join(',')};spaceRole.value='';spaceType.value=0;if(picture.value.spaceId)try{const info=await api<{role:string;space:{spaceType:number}}>(`/space/get/vo?id=${picture.value.spaceId}`,undefined,'GET');spaceRole.value=info.role;spaceType.value=info.space.spaceType}catch{spaceRole.value='viewer'}}catch(e){message.error((e as Error).message)}}
async function save(){if(!picture.value)return;busy.value=true;try{await api('/picture/edit',{id:picture.value.id,...form.value,tags:form.value.tags.split(/[,，]/).map(x=>x.trim()).filter(Boolean)});message.success('已保存，公共图片将重新进入审核');editing.value=false;await load()}catch(e){message.error((e as Error).message)}finally{busy.value=false}}
async function share(){if(!picture.value)return;busy.value=true;try{const code=await api<string>('/picture/share',{id:picture.value.id});shareUrl.value=`${location.origin}/share/${code}`;sharing.value=true}catch(e){message.error((e as Error).message)}finally{busy.value=false}}
async function revoke(){try{await api('/picture/share/revoke',{id:picture.value!.id});shareUrl.value='';sharing.value=false;message.success('分享链接已撤销')}catch(e){message.error((e as Error).message)}}
async function copy(){try{await navigator.clipboard.writeText(shareUrl.value);message.success('已复制分享链接')}catch{message.info(shareUrl.value)}}
async function remove(){if(!picture.value||!window.confirm('删除这张图片？'))return;try{await api('/picture/delete',{id:picture.value.id});message.success('图片已删除');await router.push('/my')}catch(e){message.error((e as Error).message)}}
function download(){if(picture.value)window.location.href=media(picture.value,false,route.query.code as string||undefined,true)}
async function connect(){if(!picture.value?.spaceId){message.info('实时协作仅在团队空间提供');return}const p=location.protocol==='https:'?'wss':'ws';collab.value=new WebSocket(`${p}://${location.host}/api/ws/picture?pictureId=${picture.value.id}`);collab.value.onopen=()=>{connected.value=true;collab.value?.send(JSON.stringify({type:'lock'}));heartbeat.value=window.setInterval(()=>collab.value?.send(JSON.stringify({type:'heartbeat'})),10000)};collab.value.onclose=()=>{connected.value=false;lock.value=false;if(heartbeat.value)window.clearInterval(heartbeat.value)};collab.value.onmessage=e=>{const x=JSON.parse(e.data);lock.value=x.type!=='busy'&&String(x.userId)===String(store.loginUser.id);note.value=x.type==='busy'?'另一位成员正在编辑':`成员 ${x.userId} 正在协作`;if(x.type==='transform'){rotation.value=x.rotation;flip.value=x.flip}if(x.type==='refresh')load()}}
function transform(){rotation.value=(rotation.value+90)%360;collab.value?.send(JSON.stringify({type:'transform',rotation:rotation.value,flip:flip.value}))}
function flipImage(){flip.value=!flip.value;collab.value?.send(JSON.stringify({type:'transform',rotation:rotation.value,flip:flip.value}))}
async function saveTransform(){if(!picture.value)return;busy.value=true;try{picture.value=await api<Picture>('/picture/transform',{id:picture.value.id,rotation:rotation.value,flip:flip.value});message.success('图片编辑已保存');rotation.value=0;flip.value=false;collab.value?.send(JSON.stringify({type:'refresh'}));await load()}catch(e){message.error((e as Error).message)}finally{busy.value=false}}
async function aiEdit(){if(!picture.value)return;busy.value=true;try{picture.value=await api<Picture>('/picture/ai/edit',{id:picture.value.id,prompt:aiPrompt.value});message.success('AI 编辑完成');aiOpen.value=false;aiPrompt.value='';await load()}catch(e){message.error((e as Error).message)}finally{busy.value=false}}
async function outpaint(){if(!picture.value)return;busy.value=true;try{picture.value=await api<Picture>('/picture/ai/outpaint',{id:picture.value.id,scale:outpaintScale.value,prompt:outpaintPrompt.value});message.success('扩图完成');outpaintOpen.value=false;outpaintPrompt.value='';await load()}catch(e){message.error((e as Error).message)}finally{busy.value=false}}
async function cropped(updated: Picture) { picture.value = updated; await load(); if (collab.value?.readyState === WebSocket.OPEN) collab.value.send(JSON.stringify({ type: 'refresh' })) }
watch(()=>route.params.id,()=>{collab.value?.close();load()},{immediate:true});onMounted(()=>{if(route.params.code)api<Picture>(`/picture/share/get?code=${route.params.code}`,undefined,'GET').then(p=>{picture.value=p}).catch(e=>message.error((e as Error).message))})
onBeforeUnmount(() => { collab.value?.close(); if (heartbeat.value) window.clearInterval(heartbeat.value) })
</script>
<template>
  <a-spin :spinning="busy"><template v-if="picture">
    <div class="detail-top"><a-button type="text" @click="router.back()">← 返回图库</a-button><a-space><a-button v-if="spaceType === 1 && canEdit" @click="connect">{{connected?'正在协作':'开启实时协作'}}</a-button><a-button @click="download">下载原图</a-button><a-button v-if="canEdit" @click="editing=true">编辑信息</a-button><a-button v-if="canEdit" @click="aiOpen=true">AI 编辑</a-button><a-button v-if="canEdit" @click="outpaintOpen=true">AI 扩图</a-button><a-button v-if="canEdit" @click="share">分享</a-button><a-button v-if="canEdit" danger @click="remove">删除</a-button></a-space></div>
    <a-alert v-if="note" :message="note" :type="lock?'info':'warning'" show-icon />
    <div class="detail-layout"><div class="detail-preview"><img :src="media(picture,false,route.query.code as string||undefined)" :alt="picture.name" :style="{transform:`rotate(${rotation}deg) scaleX(${flip?-1:1})`}"/><div v-if="canEdit" class="edit-tools"><a-button @click="cropOpen=true">裁剪</a-button><a-button @click="transform">旋转 90°</a-button><a-button @click="flipImage">{{flip?'恢复翻转':'水平翻转'}}</a-button><a-button v-if="rotation||flip" type="primary" @click="saveTransform">保存变换</a-button></div></div>
      <aside class="detail-info"><span class="eyebrow">PICTURE / {{picture.picFormat.toUpperCase()}}</span><h1>{{picture.name}}</h1><p class="muted">{{picture.introduction||'一张值得收藏的作品。'}}</p><a-tag :color="picture.reviewStatus===1?'green':picture.reviewStatus===2?'red':'gold'">{{status[picture.reviewStatus]}}</a-tag><a-descriptions :column="1" class="metadata"><a-descriptions-item label="创作者">{{picture.user?.userName||'创作者'}}</a-descriptions-item><a-descriptions-item label="尺寸">{{picture.picWidth}} × {{picture.picHeight}}</a-descriptions-item><a-descriptions-item label="文件大小">{{size(picture.picSize)}}</a-descriptions-item><a-descriptions-item label="分类">{{picture.category||'未分类'}}</a-descriptions-item><a-descriptions-item label="浏览 / 下载">{{picture.viewCount||0}} / {{picture.downloadCount||0}}</a-descriptions-item><a-descriptions-item label="标签"><a-tag v-for="t in picture.tags" :key="t">{{t}}</a-tag></a-descriptions-item></a-descriptions><RouterLink v-if="picture.spaceId" :to="`/space/${picture.spaceId}`"><a-button block>打开所在空间</a-button></RouterLink><a-button block class="similar-link" @click="router.push(`/similar/${picture.id}`)">找相似图片</a-button></aside>
    </div>
    <a-modal v-model:open="editing" title="编辑图片信息" @ok="save"><a-form layout="vertical"><a-form-item label="名称"><a-input v-model:value="form.name" :maxlength="128"/></a-form-item><a-form-item label="简介"><a-textarea v-model:value="form.introduction" :maxlength="800"/></a-form-item><a-form-item label="分类"><a-input v-model:value="form.category" :maxlength="64"/></a-form-item><a-form-item label="标签"><a-input v-model:value="form.tags"/></a-form-item></a-form></a-modal>
    <a-modal v-model:open="sharing" title="分享图片"><p>链接 7 天内有效。可随时撤销。</p><a-input :value="shareUrl" readonly/><template #footer><a-button danger @click="revoke">撤销链接</a-button><a-button type="primary" @click="copy">复制链接</a-button></template></a-modal>
    <a-modal v-model:open="aiOpen" title="AI 图片编辑" @ok="aiEdit"><p class="muted">描述你希望如何改变这张图片。编辑结果会替换当前图片。</p><a-textarea v-model:value="aiPrompt" :maxlength="500" :rows="5" placeholder="例如：将天空变成金色日落，保持画面构图不变"/><p class="muted">此功能需要配置兼容 OpenAI Images Edits API 的服务。提交后，当前图片和描述会发送到站点配置的模型服务。</p></a-modal>
    <a-modal v-model:open="outpaintOpen" title="AI 扩图" ok-text="开始扩图" cancel-text="取消" :confirm-loading="busy" @ok="outpaint">
      <a-form layout="vertical">
        <a-form-item label="画布倍数">
          <a-select v-model:value="outpaintScale" :options="[{ label: '1.25 倍', value: 1.25 }, { label: '1.5 倍', value: 1.5 }, { label: '2 倍', value: 2 }]" />
        </a-form-item>
        <a-form-item label="补充描述（可选）">
          <a-textarea v-model:value="outpaintPrompt" :maxlength="500" :rows="3" placeholder="例如：向画面四周延伸同样的风景" />
        </a-form-item>
      </a-form>
      <p class="muted">透明边缘会交给模型生成，原图中心由遮罩保留。结果会替换当前图片。</p>
    </a-modal>
    <ImageCropper v-model:open="cropOpen" :picture="picture" @saved="cropped" />
  </template><a-empty v-else description="找不到这张图片"/></a-spin>
</template>
