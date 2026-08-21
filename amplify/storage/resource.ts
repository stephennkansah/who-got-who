import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'whoGotWhoMedia',
  access: (allow) => ({
    'avatars/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete']),
    ],
    'proofs/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete']),
    ],
  }),
});
