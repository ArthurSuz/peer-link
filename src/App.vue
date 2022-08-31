<template>
  <div class="header">{{ showInfo ? 'MyInfo' : 'ChatRoom' }}</div>
  <div class="main">
    <div class="chat" v-if="!showInfo">
      <div>{{ chatData }}</div>
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
  <!-- <div>
    <n-input-group>
      <n-input v-model:value="text" type="text" placeholder="聊点什么" @keyup.enter="send" />
      <n-button ghost @click="send">发送</n-button>
    </n-input-group>
    <div v-for="item in message">{{ item.id }}：{{ item.msg }}</div>
    <n-modal v-model:show="showModal" preset="dialog" positive-text="添加" negative-text="取消" :showIcon="false" @positive-click="handleAdd">
      <template #header>添加聊天对象</template>
      <n-input v-model:value="peerId" type="text" placeholder="聊天对象的id" />
    </n-modal>
  </div> -->
</template>
<script setup lang="ts">
import { DataConnection, Peer } from 'peerjs'
import { reactive, ref } from 'vue'
import { ChatbubblesOutline, PersonOutline, AddCircleOutline, Pencil } from '@vicons/ionicons5'
import { NButton, NIcon, NInput, NInputGroup, NModal } from 'naive-ui'

const text = ref<string>('')
const peerId = ref<string>('')
const myPeerId = ref<string>('')
const changeNickname = ref<boolean>(false)
const showAddDialog = ref<boolean>(false)
const chatData = reactive<IChatData[]>([])
const nickname = ref(Math.random().toString(36).substr(2, 4))
const showInfo = ref(false)

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

const accept = (res: IConn, conn: DataConnection) => {
  switch (res.cmd) {
    case 'add':
      conn.send({ cmd: 'allow-add', data: { name: nickname.value } })
      break
  }
  updateList(conn.peer, false, res.data)
}

const send = (peerId: string, cmd: TConnCmd, msg?: string) => {
  const conn = peer.connect(peerId)
  conn.on('open', () => {
    switch (cmd) {
      case 'add':
        conn.send({ cmd: 'add' })
        updateList(peerId, true)
        break
      case 'msg':
        const data = { name: nickname.value, msg, timestamp: Date.now() }
        conn.send({ cmd: 'msg', data })
        updateList(peerId, true, data)
    }
  })
}
const updateList = (peerId: string, isMine: boolean, data?: IConnData) => {
  const item = chatData.find((e) => e.id === peerId)
  if (item) {
    !isMine && data?.name && (item.name = data.name)
    data?.msg && item.msg.push({ isMine, text: data.msg, timestamp: data.timestamp || Date.now() })
  } else {
    const options: IChatData = {
      id: peerId,
      name: isMine ? '' : data?.name ?? '',
      msg: [],
    }
    data?.msg && options.msg.push({ isMine, text: data.msg, timestamp: data.timestamp || Date.now() })
    chatData.push(options)
  }
}

interface IChatData {
  id: string
  name: string
  msg: {
    isMine: boolean
    text: string
    timestamp: number
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
  timestamp?: number
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
.main
  height calc(100vh - 80px)
  width 100vw
  margin-top 30px
  overflow hidden
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
    .add-button
      position absolute
      right 30px
      bottom 30px

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
</style>
