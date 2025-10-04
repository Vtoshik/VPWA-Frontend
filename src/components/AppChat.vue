<template>
    <div class="chat-messages">
      <q-chat-message
        v-for="message in messages"
        :key="message.stamp + message.name"
        :name="message.name"
        :text="message.text"
        :stamp="message.stamp"
        :sent="message.sent"
        bg-color="white"
      />
      
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

  type Message = {
    name: string,
    text: string[],
    stamp: string,
    sent?:boolean,
  }

  //Load messages from JSON file
  const messages = ref<Message[]>([]);
  
  onMounted(async () => {
    try{
      const response = await fetch('/src/assets/test-messages/mock-messages.json');
      messages.value = await response.json();
    }catch(err){
      console.log('Error loading mock messages:', err);
    }
  })

</script>

<style scoped>
.chat-messages {
  max-width: 550px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
