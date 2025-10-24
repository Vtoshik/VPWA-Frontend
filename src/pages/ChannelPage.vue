<template>
  <q-page class="channel-page">
    <!-- Channel Header -->
    <div class="channel-header">
      <div class="channel-title"><span class="channel-hash">#</span>{{ channelName }}</div>
      <q-btn
        flat
        dense
        round
        icon="group"
        aria-label="Toggle Members"
        @click="toggleMembersPanel"
        class="header-btn"
      />
    </div>

    <!-- Main content area -->
    <div class="channel-content">
      <!-- Chat area -->
      <div class="chat-area-wrapper">
        <q-scroll-area class="chat-main">
          <ChatArea
            :message-file="messageFile"
            :all-messages="allMessages"
            :current-user-nickname="currentUserNickname"
            @update-messages="messages = $event"
          />
        </q-scroll-area>
        <CommandLine class="chat-input" @send-message="addMessage" @command="executeCommand" />
      </div>

      <!-- Members panel -->
      <transition name="slide-left">
        <div v-if="showMembersPanel" class="members-panel">
          <MembersList :members="channelMembers" />
        </div>
      </transition>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import ChatArea from 'src/components/ChatArea.vue';
import CommandLine from 'src/components/CommandLine.vue';
import MembersList from 'src/components/MembersList.vue';
import type { Message, Member, Command } from 'src/components/models';
import { getCurrentUser } from 'src/utils/mockAuth';

const route = useRoute();
const showMembersPanel = ref(true);
const messages = ref<Message[]>([]);
const localMessages = ref<Message[]>([]);
const members = ref<{ [key: string]: Member[] }>({});

const channelId = computed(() => (route.params.id as string) || 'general');
const messageFile = computed(
  () => (route.query.file as string) || '/src/assets/test-data/mock-messages.json',
);
const channelName = computed(() => {
  return channelId.value.charAt(0).toUpperCase() + channelId.value.slice(1);
});
const channelMembers = computed(() => members.value[channelId.value] || []);
const allMessages = computed(() => [...messages.value, ...localMessages.value]);

const currentUser = computed(() => getCurrentUser());
const currentUserNickname = computed(() => currentUser.value?.nickName || '');

onMounted(async () => {
  try {
    const membersResponse = await fetch('/src/assets/test-data/mock-members.json');
    members.value = await membersResponse.json();
  } catch (error) {
    console.error('Error loading members:', error);
  }
});

// Watch for typing updates
watch(
  channelId,
  () => {
    const interval = setInterval(() => {
      const typingKey = `typing:${channelId.value}`;
      const typingData = localStorage.getItem(typingKey);
      const currentMembers = members.value[channelId.value];
      if (typingData && currentMembers) {
        try {
          const parsed = JSON.parse(typingData);
          members.value[channelId.value] = currentMembers.map((member) => {
            const typing = parsed[member.id];
            if (typing) {
              return { ...member, isTyping: true, typingText: typing };
            }
            return { ...member, isTyping: false, typingText: '' };
          });
        } catch {
          console.error('Error parsing typing data from localStorage');
        }
      }
    }, 500);

    return () => clearInterval(interval);
  },
  { immediate: true },
);

function toggleMembersPanel() {
  showMembersPanel.value = !showMembersPanel.value;
}

function addMessage(text: string) {
  const mentionedUsers = parseMentions(text);

  const newMessage: Message = {
    name: 'me',
    text: [text],
    stamp: new Date().toLocaleTimeString(),
    sent: true,
  };

  if (mentionedUsers.length > 0) {
    newMessage.mentionedUsers = mentionedUsers;
  }

  messages.value.push(newMessage);
  localStorage.setItem(messageFile.value, JSON.stringify(messages.value));
  console.log('New message saved to localStorage for:', messageFile.value, newMessage);
}

function parseMentions(text: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const matches = text.matchAll(mentionRegex);
  const mentioned: string[] = [];
  const validNicknames = channelMembers.value.map((m) => m.nickName);

  for (const match of matches) {
    const nickname = match[1];
    if (nickname && validNicknames.includes(nickname) && !mentioned.includes(nickname)) {
      mentioned.push(nickname);
    }
  }

  if (mentioned.length > 0) {
    console.log(`📢 Mentioned users: ${mentioned.join(', ')}`);
  }

  return mentioned;
}

function executeCommand(command: Command) {
  let resultText = '';

  switch (command.name) {
    case 'list':
      resultText = `Users in channel: ${channelMembers.value.map((m) => m.nickName).join(', ')}`;
      break;
    case 'join':
      resultText =
        command.args.length > 0 ? `Joining channel: ${command.args[0]}` : 'Usage: /join <channel>';
      break;
    case 'quit':
    case 'cancel':
      resultText = 'Leaving channel...';
      break;
    case 'kick':
      resultText =
        command.args.length > 0 ? `Kicking user: ${command.args[0]}` : 'Usage: /kick <user>';
      break;
    case 'revoke':
      resultText =
        command.args.length > 0 ? `Revoking invite: ${command.args[0]}` : 'Usage: /revoke <user>';
      break;
    case 'invite':
      resultText =
        command.args.length > 0 ? `Inviting user: ${command.args[0]}` : 'Usage: /invite <user>';
      break;
    default:
      resultText = `Unknown command: /${command.name}`;
  }

  const commandResult: Message = {
    name: 'System',
    text: [resultText],
    stamp: new Date().toLocaleTimeString(),
    sent: false,
    isCommand: true,
    isLocal: true,
    channelId: channelId.value,
  };

  localMessages.value.push(commandResult);
}

watch(channelId, () => {
  localMessages.value = [];
});
</script>

<style scoped>
.channel-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

/* Channel Header */
.channel-header {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  min-height: 48px;
  background: #313338;
  box-shadow:
    0 1px 0 rgba(4, 4, 5, 0.2),
    0 1.5px 0 rgba(6, 6, 7, 0.05),
    0 2px 0 rgba(4, 4, 5, 0.05);
  border-bottom: 1px solid #26282c;
}

.channel-title {
  font-size: 16px;
  font-weight: 600;
  color: #f2f3f5;
  letter-spacing: 0.02em;
}

.channel-hash {
  color: #80848e;
  margin-right: 4px;
  font-weight: 500;
}

.header-btn {
  color: #b5bac1;
  transition: color 0.2s ease;
}

.header-btn:hover {
  color: #dbdee1;
  background: rgba(79, 84, 92, 0.16);
}

/* Channel Content */
.channel-content {
  flex: 1 1 auto;
  display: flex;
  overflow: hidden;
  background: #36393f;
}

/* Chat Area */
.chat-area-wrapper {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.chat-main {
  flex: 1 1 auto;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.chat-input {
  flex: 0 0 auto;
  background: transparent;
}

/* Members Panel */
.members-panel {
  flex: 0 0 280px;
  width: 280px;
  background: #2f3136;
  border-left: 1px solid #1e1f22;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

/* Slide animation */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.3s ease;
}

.slide-left-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-left-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
