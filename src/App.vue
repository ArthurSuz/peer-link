<template>
  <div class="main">
    <div>{{ myPeerId || '生成中' }}</div>
    <input type="text" v-model="peerId" />
    <textarea v-model="text" />
    <button @click="send">发送</button>
    <div v-for="item in message">{{ item }}</div>
  </div>
</template>
<script setup lang="ts">
import { Peer } from 'peerjs'
import { Ref, ref } from 'vue'

const text = ref('')
const peerId = ref('')
const myPeerId = ref('')
const message: Ref<string[]> = ref([])
const peer = new Peer()
peer.on('open', (id) => {
  myPeerId.value = id
})
peer.on('connection', (c) => {
  peerId.value = c.peer
  c.on('data', (data) => {
    message.value.push(data as string)
    c.send('re:' + data)
  })
})

const send = () => {
  const conn = peer.connect(peerId.value)
  conn.on('open', () => {
    conn.send(text.value)
  })
}
</script>
<style lang="stylus">
body
  margin 0
  font-family PingFang SC,HarmonyOS_Regular,Helvetica Neue,Microsoft YaHei,sans-serif!important
.main
  display flex
  flex-direction column
</style>
