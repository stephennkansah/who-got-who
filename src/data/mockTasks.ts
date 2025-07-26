import { Task, TaskPack } from '../types';

// Core Pack A - Stealth Tasks for Party Games
const corePackATasks: Task[] = [
  {
    id: 'a001',
    text: 'Get someone to say the word "banana" without asking directly',
    tips: 'Start a conversation about fruit or smoothies'
  },
  {
    id: 'a002',
    text: 'Make someone laugh out loud within 2 minutes',
    tips: 'Tell a joke, do an impression, or share a funny story'
  },
  {
    id: 'a003',
    text: 'Get someone to check their phone',
    tips: 'Mention something about time, notifications, or ask about an app'
  },
  {
    id: 'a004',
    text: 'Make someone say "excuse me" or "sorry"',
    tips: 'Gently bump into them, block their path slightly, or step in their way'
  },
  {
    id: 'a005',
    text: 'Get someone to touch their face or hair',
    tips: 'Mention something about appearances or compliment their style'
  },
  {
    id: 'a006',
    text: 'Make someone look up at the ceiling',
    tips: 'Point up, mention a sound, or comment about lighting'
  },
  {
    id: 'a007',
    text: 'Get someone to count something out loud',
    tips: 'Ask about quantities, time, or start counting yourself'
  },
  {
    id: 'a008',
    text: 'Make someone stretch or yawn',
    tips: 'Yawn yourself, mention being tired, or stretch obviously'
  },
  {
    id: 'a009',
    text: 'Get someone to say a color name',
    tips: 'Comment on their outfit, surroundings, or start a color-related topic'
  },
  {
    id: 'a010',
    text: 'Make someone clap their hands',
    tips: 'Start applauding something, tell an exciting story, or celebrate'
  },
  {
    id: 'a011',
    text: 'Get someone to sing or hum',
    tips: 'Mention a catchy song, start humming yourself, or talk about music'
  },
  {
    id: 'a012',
    text: 'Make someone say "what?" or "huh?"',
    tips: 'Speak quietly, mumble slightly, or say something unexpected'
  },
  {
    id: 'a013',
    text: 'Get someone to adjust their clothing',
    tips: 'Compliment their outfit, mention dress codes, or adjust your own clothes'
  },
  {
    id: 'a014',
    text: 'Make someone mention food or drinks',
    tips: 'Ask about dinner plans, mention you\'re hungry, or talk about restaurants'
  },
  {
    id: 'a015',
    text: 'Get someone to look at their watch or ask about time',
    tips: 'Mention schedules, appointments, or wonder about the time yourself'
  },
  {
    id: 'a016',
    text: 'Make someone say "please" or "thank you"',
    tips: 'Offer help, ask for a small favor, or do something nice for them'
  },
  {
    id: 'a017',
    text: 'Get someone to mention the weather',
    tips: 'Comment on temperature, look outside, or mention outdoor plans'
  },
  {
    id: 'a018',
    text: 'Make someone cross their arms',
    tips: 'Cross your arms first, make them defensive, or create a cold environment'
  },
  {
    id: 'a019',
    text: 'Get someone to say a number above 10',
    tips: 'Ask about ages, quantities, prices, or start a numbers conversation'
  },
  {
    id: 'a020',
    text: 'Make someone take a step backward',
    tips: 'Step closer gradually, gesture forward, or move into their space'
  },
  {
    id: 'a021',
    text: 'Get someone to mention a day of the week',
    tips: 'Talk about plans, schedules, work, or what day you think it is'
  },
  {
    id: 'a022',
    text: 'Make someone nod their head',
    tips: 'Ask yes/no questions, make agreeable statements, or nod yourself'
  },
  {
    id: 'a023',
    text: 'Get someone to point at something',
    tips: 'Ask "where is...?", look confused about directions, or point yourself'
  },
  {
    id: 'a024',
    text: 'Make someone say "really?" or "seriously?"',
    tips: 'Tell an unbelievable story, make a surprising claim, or share news'
  },
  {
    id: 'a025',
    text: 'Get someone to mention a family member',
    tips: 'Talk about families, holidays, or ask about their background'
  },
  {
    id: 'a026',
    text: 'Make someone clear their throat or cough',
    tips: 'Clear your throat first, mention dusty air, or speak in a way that\'s hard to hear'
  },
  {
    id: 'a027',
    text: 'Get someone to say "awesome" or "cool"',
    tips: 'Share exciting news, show them something interesting, or be enthusiastic'
  },
  {
    id: 'a028',
    text: 'Make someone look at their hands',
    tips: 'Comment on jewelry, nails, or mention something about hands'
  },
  {
    id: 'a029',
    text: 'Get someone to mention a type of transportation',
    tips: 'Talk about travel, commuting, getting somewhere, or vacation plans'
  },
  {
    id: 'a030',
    text: 'Make someone say "maybe" or "possibly"',
    tips: 'Ask uncertain questions, make tentative plans, or discuss probabilities'
  },
  {
    id: 'a031',
    text: 'Get someone to mention an animal',
    tips: 'Talk about pets, wildlife, zoo visits, or make animal comparisons'
  },
  {
    id: 'a032',
    text: 'Make someone shake their head',
    tips: 'Ask questions they\'ll disagree with, make false statements, or be silly'
  },
  {
    id: 'a033',
    text: 'Get someone to say "exactly" or "definitely"',
    tips: 'Make statements they strongly agree with, be very certain about something'
  },
  {
    id: 'a034',
    text: 'Make someone look around the room',
    tips: 'Mention you lost something, comment on decorations, or act confused about location'
  },
  {
    id: 'a035',
    text: 'Get someone to mention technology or apps',
    tips: 'Talk about phones, social media, or ask for tech help'
  }
];

export const corePackA: TaskPack = {
  id: 'core-pack-a',
  name: 'Core Pack A',
  description: 'Essential stealth tasks perfect for any group',
  difficulty: 'medium',
  minPlayers: 2,
  maxPlayers: 8,
  tasks: corePackATasks
};

// Helper function to get random tasks for a player
export function getRandomTasks(packId: string, count: number = 7): Task[] {
  const pack = getTaskPack(packId);
  if (!pack) return [];
  
  const shuffled = [...pack.tasks].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Helper function to get a task pack by ID
export function getTaskPack(packId: string): TaskPack | null {
  switch (packId) {
    case 'core-a':
    case 'core-pack-a':  // Handle both IDs
      return corePackA;
    // Future packs would go here
    default:
      return null;
  }
}

// Helper function to get a random task for swapping
export function getRandomTask(packId: string, excludeIds: string[] = []): Task | null {
  const pack = getTaskPack(packId);
  if (!pack) return null;
  
  const availableTasks = pack.tasks.filter(task => !excludeIds.includes(task.id));
  if (availableTasks.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * availableTasks.length);
  return availableTasks[randomIndex];
}

// Mock data for other packs (placeholders)
export const mockTasks = {
  corePackA,
  getRandomTasks,
  getTaskPack,
  getRandomTask
}; 