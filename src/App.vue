<template>
  <div v-if="!showChatRoom">
    <div class="header">{{ showInfo ? 'MyInfo' : 'ChatRooms' }}</div>
    <div class="main">
      <div class="chat" v-if="!showInfo">
        <div class="chat-item" v-for="(item, index) in chatData" :key="index" @click="chatting(index)">
          <div class="chat-info">
            <span>{{ item.name || 'unkown' }}</span>
            <span>{{ getMsg(item) }}</span>
          </div>
          <n-icon size="30" color="#909399"><ChevronForward /></n-icon>
        </div>
        <n-button size="large" circle class="add-button" type="primary" @click="showAddDialog = true">
          <template #icon>
            <n-icon size="50"><AddCircleOutline /></n-icon>
          </template>
        </n-button>
      </div>
      <div class="info" v-else>
        <h3>NickName</h3>
        <div class="nickname" @click="changeNickname = true" v-if="!changeNickname">
          <span>{{ nickname }}</span>
          <n-icon size="20" color="#909399"><Pencil /></n-icon>
        </div>
        <n-input-group class="nickname-set" v-else>
          <n-input v-model:value="nickname" type="text" placeholder="Your NickName" />
          <n-button type="primary" @click="changeNickname = false">
            <template #icon>
              <n-icon size="20"><Pencil /></n-icon>
            </template>
          </n-button>
        </n-input-group>
        <h3>MyId</h3>
        <div>{{ myPeerId || 'Loading...' }}</div>
      </div>
    </div>
    <div class="footer">
      <div class="footer-item" :class="{ active: !showInfo }" @click="showInfo = false"><ChatbubblesOutline /></div>
      <div class="footer-item" :class="{ active: showInfo }" @click="showInfo = true"><PersonOutline /></div>
    </div>
    <n-modal v-model:show="showAddDialog" preset="dialog" positive-text="添加" :showIcon="false" @positive-click="handleAdd" :auto-focus="false">
      <template #header>添加聊天对象</template>
      <n-input v-model:value="peerId" type="text" placeholder="id" />
    </n-modal>
  </div>
  <div v-else>
    <div class="header">
      <div>{{ chattingItem.name || chattingItem.id }}</div>
      <n-icon class="back" size="25" @click="showChatRoom = false"><ChevronBack /></n-icon>
    </div>
    <div class="main">
      <div class="chat">
        <div v-for="item in chattingItem.msg || []" :class="['chat-msg', { me: item.isMine }]">{{ item.text }}</div>
      </div>
    </div>
    <n-input-group class="chat-input">
      <n-input size="large" v-model:value="text" type="text" placeholder="聊点什么" @keyup.enter="sendMsg" />
      <n-button size="large" ghost @click="sendMsg">发送</n-button>
    </n-input-group>
  </div>
</template>
<script setup lang="ts">
import { DataConnection, Peer } from 'peerjs'
import { reactive, ref, computed } from 'vue'
import { ChatbubblesOutline, PersonOutline, AddCircleOutline, Pencil, ChevronForward, ChevronBack } from '@vicons/ionicons5'
import { NButton, NIcon, NInput, NInputGroup, NModal } from 'naive-ui'

const text = ref<string>('')
const peerId = ref<string>('')
const myPeerId = ref<string>('')
const changeNickname = ref<boolean>(false)
const showAddDialog = ref<boolean>(false)
const chatData = reactive<IChatData[]>([])
const nickname = ref<string>(Math.random().toString(36).substr(2, 4))
const showInfo = ref<boolean>(false)
const showChatRoom = ref<boolean>(false)
const chattingIndex = ref<number>(0)

const chattingItem = computed(() => {
  return chatData[chattingIndex.value]
})

const handleAdd = () => {
  send(peerId.value, 'add')
  peerId.value = ''
}

const peer = new Peer()
peer.on('open', (id) => {
  myPeerId.value = id
})
peer.on('connection', (c) => {
  c.on('data', (res) => {
    accept(res as IConn, c)
  })
})

const getMsg = (item: any) => {
  const msgArr = item.msg || []
  const lastMsg = msgArr[msgArr.length - 1]
  return lastMsg?.text || (item.name ? `You have added ${item.name}, chatting now` : `Not connected yet`)
}

const accept = (res: IConn, conn: DataConnection) => {
  switch (res.cmd) {
    case 'add':
      send(conn.peer, 'allow-add')
      break
  }
  updateList(conn.peer, false, res.data)
}

const sendMsg = () => {
  if (!text.value) {
    return
  }
  send(chattingItem.value.id, 'msg', text.value)
  text.value = ''
}

const send = (peerId: string, cmd: TConnCmd, msg?: string) => {
  const conn = peer.connect(peerId)
  let options: any
  switch (cmd) {
    case 'add':
      options = { cmd: 'add', data: { name: nickname.value } }
      updateList(peerId, true)
      break
    case 'allow-add':
      options = { cmd: 'allow-add', data: { name: nickname.value } }
      break
    case 'msg':
      const data = { name: nickname.value, msg }
      options = { cmd: 'msg', data }
      updateList(peerId, true, data)
  }
  conn.on('open', () => {
    conn.send(options)
  })
}
const updateList = (peerId: string, isMine: boolean, data?: IConnData) => {
  const item = chatData.find((e) => e.id === peerId)
  if (item) {
    !isMine && data?.name && (item.name = data.name)
    data?.msg && item.msg.push({ isMine, text: data.msg })
  } else {
    const options: IChatData = {
      id: peerId,
      name: isMine ? '' : data?.name ?? '',
      msg: [],
    }
    data?.msg && options.msg.push({ isMine, text: data.msg })
    chatData.push(options)
  }
}

const chatting = (index: number) => {
  chattingIndex.value = index
  showChatRoom.value = true
}

interface IChatData {
  id: string
  name: string
  msg: {
    isMine: boolean
    text: string
  }[]
}

interface IConn {
  cmd: TConnCmd
  data?: IConnData
}

type TConnCmd = 'msg' | 'add' | 'allow-add'

interface IConnData {
  name: string
  msg?: string
}
</script>
<style lang="stylus">
body
  margin 0
  font-family PingFang SC,HarmonyOS_Regular,Helvetica Neue,Microsoft YaHei,sans-serif!important
  font-size 16px
.header
  position fixed
  top 0
  left 0
  right 0
  display flex
  justify-content center
  align-items center
  height 30px
  background-color #F2F6FC
  border-bottom 1px solid #DCDFE6
  font-weight bold
  .back
    position absolute
    left 0
    padding 0 5px
    cursor pointer
.main
  height calc(100vh - 80px)
  width 100vw
  margin-top 30px
  overflow scroll
  position relative
  .info
    width 100%
    height 100%
    display flex
    align-items center
    justify-content center
    flex-direction column
    .nickname
      cursor pointer
      display flex
      align-items center
      span
        margin-right 10px
    .nickname-set
      width 80%
  .chat
    display flex
    flex-direction column
    &-item
      height 80px
      border-bottom 1px solid #DCDFE6
      cursor pointer
      display flex
      align-items center
      justify-content space-between
      padding 0 10px
    &-info
      display flex
      flex-direction column
      span:nth-child(1)
        font-size 18px
        font-weight bold
        color #303133
      span:nth-child(2)
        font-size 12px
        color #909399

    .add-button
      position fixed
      right 30px
      bottom 90px
  .chat-msg
    padding 5px 8px
    margin 8px 10px
    border-radius 5px
    line-height 1.1
    word-break break-all
    align-self flex-start
    background-color #C0C4CC

    &.me
      align-self flex-end
      background-color #67C23A

.footer
  position fixed
  bottom 0
  left 0
  right 0
  display flex
  height 50px
  border-top 1px solid #DCDFE6
  background-color #F2F6FC

  &-item
    cursor pointer
    flex 1
    display flex
    align-items center
    justify-content center
    &.active
      color #67C23A
    svg
      width 30px
    &+&
      border-left 1px solid #DCDFE6

.chat-input
  position fixed
  bottom 0
  left 0
  right 0
</style>
