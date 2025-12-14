import type { Command, Member } from 'src/services/models';
import { useChannels } from 'src/utils/Channels';
import type { Router } from 'vue-router';
import { apiService } from 'src/services/api';
import { Notify } from 'quasar';
import type { Ref } from 'vue';

export async function executeCommand(
  command: Command,
  channelId: Ref<string>,
  members: Ref<{ [key: string]: Member[] }>,
  showMembersPanel: Ref<boolean>,
  router: Router,
) {
  const commandName = command.name.toLowerCase();
  const args = command.args;

  try {
    switch (command.name) {
      case 'list':
        showNotification('Members list displayed', 'info');
        showMembersPanel.value = true;
        break;
      case 'join': {
        const channelName = args[0];
        const isPrivate = args[1]?.toLowerCase() === 'private';

        if (!channelName) {
          showNotification('Usage: /join <channelName> [private]', 'warning');
          return;
        }

        const { joinChannel: join, createChannel } = useChannels();

        // If user specified 'private', create a private channel directly
        if (isPrivate) {
          try {
            const newChannel = await createChannel(channelName, true);
            if (newChannel) {
              showNotification(`Created and joined private channel #${channelName}`, 'positive');
              void router.push(`/channel/${newChannel.id}`);
            }
          } catch (err) {
            const error = err as { response?: { data?: { message?: string } } };
            showNotification(
              error.response?.data?.message || 'Failed to create private channel',
              'negative',
            );
          }
        } else {
          // Otherwise, try to join existing public channel
          try {
            const channel = await join(channelName);
            if (channel) {
              showNotification(`Joined channel #${channel.name}`, 'positive');
              void router.push(`/channel/${channel.id}`);
            }
          } catch (err) {
            const error = err as { response?: { data?: { message?: string } } };
            showNotification(
              error.response?.data?.message ||
                'Channel not found. Use "/join <name> private" to create a new private channel.',
              'negative',
            );
          }
        }
        break;
      }
      case 'quit': {
        const { deleteChannel } = useChannels();
        const quitChannelId = Number(channelId.value);

        await deleteChannel(quitChannelId);
        showNotification('Channel deleted', 'positive');
        void router.push('/');
        break;
      }
      case 'cancel': {
        const { leaveChannel } = useChannels();
        const cancelChannelId = Number(channelId.value);

        await leaveChannel(cancelChannelId);
        showNotification('Left channel', 'positive');
        void router.push('/');
        break;
      }
      case 'kick': {
        const kickNickname = args[0];
        if (!kickNickname) {
          showNotification('Usage: /kick <nickname>', 'warning');
          return;
        }

        const kickChannelId = Number(channelId.value);
        const kickResponse = await apiService.kickFromChannelByNickname(
          kickChannelId,
          kickNickname,
        );
        showNotification(kickResponse.message, 'positive');
        break;
      }
      case 'revoke': {
        const revokeNickname = args[0];
        if (!revokeNickname) {
          showNotification('Usage: /revoke <nickname>', 'warning');
          return;
        }

        const revokeChannelId = Number(channelId.value);
        const revokeResponse = await apiService.revokeFromChannelByNickname(
          revokeChannelId,
          revokeNickname,
        );
        showNotification(
          `Revoked access for ${revokeNickname}: ${revokeResponse.message}`,
          'positive',
        );
        break;
      }
      case 'invite': {
        const inviteNickname = args[0];
        if (!inviteNickname) {
          showNotification('Usage: /invite <nickname>', 'warning');
          return;
        }

        const inviteChannelId = Number(channelId.value);

        await apiService.inviteToChannelByNickname(inviteChannelId, inviteNickname);
        showNotification(`Invited ${inviteNickname} to channel`, 'positive');

        const response = await apiService.getChannelMembers(inviteChannelId);

        members.value[channelId.value] = response.members.map((m) => ({
          id: String(m.userId),
          firstName: '',
          lastName: '',
          nickName: m.nickname,
          email: '',
          password: '',
          status: m.status,
          channels: [channelId.value],
        }));

        break;
      }
      default:
        showNotification(`Unknown command: /${commandName}`, 'warning');
    }
  } catch (err) {
    const error = err as { response?: { data?: { message?: string } } };
    showNotification(
      error.response?.data?.message || `Failed to execute command: /${commandName}`,
      'negative',
    );
  }
}

function showNotification(message: string, type: 'positive' | 'negative' | 'warning' | 'info') {
  Notify.create({ type, message, position: 'top' });
}
