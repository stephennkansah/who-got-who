import { Task, TaskPack } from '../types';

// Category 1: Correction Tasks (10 Tasks)
const correctionTasks: Task[] = [
  {
    id: 'c001',
    text: 'Get a player to correct a \'fact\' you stated. (e.g., "The capital of Australia is Sydney.")'
  },
  {
    id: 'c002',
    text: 'Get a player to correct your mispronunciation of a common word.'
  },
  {
    id: 'c003',
    text: 'Get a player to correct your movie quote. (e.g., "Luke, I am your father...")'
  },
  {
    id: 'c004',
    text: 'Get a player to correct your song lyrics.'
  },
  {
    id: 'c005',
    text: 'Get a player to correct you on a celebrity\'s name. (e.g., "I love that movie with Robert Downey Jr., you know, Iron Man.")'
  },
  {
    id: 'c006',
    text: 'Get a player to correct a detail from a shared memory. (e.g., "...that time we went to the beach on Saturday..." when it was a Sunday).'
  },
  {
    id: 'c007',
    text: 'Get a player to tell you the correct name for an object you misidentified. (e.g., "Can you pass me the... clicker-majig?").'
  },
  {
    id: 'c008',
    text: 'Get a player to correct you on the current day, date, or time.'
  },
  {
    id: 'c009',
    text: 'Get a player to correct the spelling of a word you spell out loud.'
  },
  {
    id: 'c010',
    text: 'Get a player to correct you on the rules of a different game or sport.'
  }
];

// Category 2: Verbal & Conversational (30 Tasks)
const verbalTasks: Task[] = [
  {
    id: 'v001',
    text: 'Get a player to say "delicious."'
  },
  {
    id: 'v002',
    text: 'Get a player to say "literally."'
  },
  {
    id: 'v003',
    text: 'Get a player to say "I don\'t know."'
  },
  {
    id: 'v004',
    text: 'Get a player to say "that\'s crazy."'
  },
  {
    id: 'v005',
    text: 'Get a player to say "one hundred percent."'
  },
  {
    id: 'v006',
    text: 'Get a player to say "thank you" to you.'
  },
  {
    id: 'v007',
    text: 'Get a player to say your name.'
  },
  {
    id: 'v008',
    text: 'Get a player to say their own name.'
  },
  {
    id: 'v009',
    text: 'Get a player to agree with you twice in a row.'
  },
  {
    id: 'v010',
    text: 'Get a player to ask you for your opinion.'
  },
  {
    id: 'v011',
    text: 'Get a player to ask the group a question.'
  },
  {
    id: 'v012',
    text: 'Get a player to ask for advice.'
  },
  {
    id: 'v013',
    text: 'Get a player to give someone else a compliment.'
  },
  {
    id: 'v014',
    text: 'Get a player to talk about the weather.'
  },
  {
    id: 'v015',
    text: 'Get a player to mention an animal.'
  },
  {
    id: 'v016',
    text: 'Get a player to name a city you\'ve never been to.'
  },
  {
    id: 'v017',
    text: 'Get a player to name a musical artist or band.'
  },
  {
    id: 'v018',
    text: 'Get a player to name a movie from the 90s.'
  },
  {
    id: 'v019',
    text: 'Get a player to talk about a dream they had.'
  },
  {
    id: 'v020',
    text: 'Get a player to bring up a memory you both share.'
  },
  {
    id: 'v021',
    text: 'Get a player to complain about traffic or transport.'
  },
  {
    id: 'v022',
    text: 'Get a player to ask what a word means.'
  },
  {
    id: 'v023',
    text: 'Get a player to mention a holiday.'
  },
  {
    id: 'v024',
    text: 'Get a player to talk about their job.'
  },
  {
    id: 'v025',
    text: 'Get a player to defend an unpopular opinion.'
  },
  {
    id: 'v026',
    text: 'Get a player to ask someone to repeat themselves.'
  },
  {
    id: 'v027',
    text: 'Get a player to quote a line from any movie.'
  },
  {
    id: 'v028',
    text: 'Get a player to say "Are you serious?"'
  },
  {
    id: 'v029',
    text: 'Get a player to swear or curse.'
  },
  {
    id: 'v030',
    text: 'Get a player to start a sentence with "No offense, but..."'
  }
];

// Category 3: Physical & Interactive (30 Tasks)
const physicalTasks: Task[] = [
  {
    id: 'p001',
    text: 'Get a player to take a sip of their drink.'
  },
  {
    id: 'p002',
    text: 'Get a player to yawn.'
  },
  {
    id: 'p003',
    text: 'Get a player to stretch their arms.'
  },
  {
    id: 'p004',
    text: 'Get a player to cross their legs.'
  },
  {
    id: 'p005',
    text: 'Get a player to cross their arms.'
  },
  {
    id: 'p006',
    text: 'Get a player to rub their eyes.'
  },
  {
    id: 'p007',
    text: 'Get a player to look up at the ceiling.'
  },
  {
    id: 'p008',
    text: 'Get a player to point at something.'
  },
  {
    id: 'p009',
    text: 'Get a player to crack their knuckles.'
  },
  {
    id: 'p010',
    text: 'Get a player to shiver and say they\'re cold.'
  },
  {
    id: 'p011',
    text: 'Get a player to pass an item on the table.'
  },
  {
    id: 'p012',
    text: 'Get a player to pick something up that was dropped.'
  },
  {
    id: 'p013',
    text: 'Get a player to stand up for any reason.'
  },
  {
    id: 'p014',
    text: 'Get a player to adjust their chair.'
  },
  {
    id: 'p015',
    text: 'Get a player to put their phone face down on the table.'
  },
  {
    id: 'p016',
    text: 'Get a player to take something out of their pocket or bag.'
  },
  {
    id: 'p017',
    text: 'Get a player to adjust their glasses.'
  },
  {
    id: 'p018',
    text: 'Get a player to tie their shoelace.'
  },
  {
    id: 'p019',
    text: 'Get a player to look at their reflection.'
  },
  {
    id: 'p020',
    text: 'Get a player to clink glasses in a "cheers."'
  },
  {
    id: 'p021',
    text: 'Get a player to give you a high-five.'
  },
  {
    id: 'p022',
    text: 'Get a player to give you a thumbs-up.'
  },
  {
    id: 'p023',
    text: 'Get a player to fist-bump someone.'
  },
  {
    id: 'p024',
    text: 'Get a player to pat someone on the back.'
  },
  {
    id: 'p025',
    text: 'Get a player to lean in to hear better.'
  },
  {
    id: 'p026',
    text: 'Get a player to shrug.'
  },
  {
    id: 'p027',
    text: 'Get a player to offer you their seat.'
  },
  {
    id: 'p028',
    text: 'Get a player to hand you their phone.'
  },
  {
    id: 'p029',
    text: 'Tap a player, then make another player believe someone else did it.'
  },
  {
    id: 'p030',
    text: 'Get a player to nod their head three times in a row.'
  }
];

// Category 4: Funny & Performative (15 Tasks)
const performativeTasks: Task[] = [
  {
    id: 'f001',
    text: 'Get a player to tell a bad joke.'
  },
  {
    id: 'f002',
    text: 'Get a player to sing a line from any song.'
  },
  {
    id: 'f003',
    text: 'Get a player to hum a tune.'
  },
  {
    id: 'f004',
    text: 'Get a player to do an impression of someone.'
  },
  {
    id: 'f005',
    text: 'Get a player to talk in a different accent for a full sentence.'
  },
  {
    id: 'f006',
    text: 'Get a player to spell a word out loud.'
  },
  {
    id: 'f007',
    text: 'Get a player to pantomime an action. (e.g., swinging a bat).'
  },
  {
    id: 'f008',
    text: 'Get a player to use air quotes.'
  },
  {
    id: 'f009',
    text: 'Get a player to start a slow clap.'
  },
  {
    id: 'f010',
    text: 'Get a player to propose a ridiculous "would you rather" question.'
  },
  {
    id: 'f011',
    text: 'Get a player to demonstrate a dance move.'
  },
  {
    id: 'f012',
    text: 'Get a player to blame an inanimate object for something. (e.g., "Stupid table!").'
  },
  {
    id: 'f013',
    text: 'Get a player to say something in a different language.'
  },
  {
    id: 'f014',
    text: 'Get a player to complain about the temperature.'
  },
  {
    id: 'f015',
    text: 'Get a player to tell you that you\'re funny.'
  }
];

// Category 5: Technology & Meta-Game (15 Tasks)
const technologyTasks: Task[] = [
  {
    id: 't001',
    text: 'Get a player to take a group selfie.'
  },
  {
    id: 't002',
    text: 'Get a player to show someone a meme on their phone.'
  },
  {
    id: 't003',
    text: 'Get a player to check their phone\'s battery percentage.'
  },
  {
    id: 't004',
    text: 'Get a player to ask for the Wi-Fi password.'
  },
  {
    id: 't005',
    text: 'Get a player to use their phone\'s flashlight.'
  },
  {
    id: 't006',
    text: 'Get a player to scroll through a social media feed.'
  },
  {
    id: 't007',
    text: 'Get a player to ask a smart assistant (Siri/Google) a question.'
  },
  {
    id: 't008',
    text: 'Get a player to say the name of the game ("Who Got Who").'
  },
  {
    id: 't009',
    text: 'Get a player to ask who is winning.'
  },
  {
    id: 't010',
    text: 'Get a player to ask for a rule to be explained.'
  },
  {
    id: 't011',
    text: 'Get a player to say "I knew it!" after a task is revealed.'
  },
  {
    id: 't012',
    text: 'Get a player to accuse someone (anyone) of having a task.'
  },
  {
    id: 't013',
    text: 'Get a player to say the word "point" or "score."'
  },
  {
    id: 't014',
    text: 'Get a player to like one of your social media posts.'
  }
];

// Bonus Category: Connection & Storytelling (15 Tasks)
// Note: These tasks are designed to create genuine connection. If you get a player to start opening up and telling a great story, the real win is the conversation itself. Don't interrupt them just to score the point. Let them finish, and then claim your success.
const connectionTasks: Task[] = [
  {
    id: 'b001',
    text: 'Get a player to describe their "perfect" day, from start to finish.'
  },
  {
    id: 'b002',
    text: 'Get a player to talk about a skill they\'ve always wanted to learn.'
  },
  {
    id: 'b003',
    text: 'Get a player to tell you about their favorite childhood memory.'
  },
  {
    id: 'b004',
    text: 'Get a player to share a story about a time they got in big trouble as a kid.'
  },
  {
    id: 'b005',
    text: 'Get a player to describe the best advice they have ever received.'
  },
  {
    id: 'b006',
    text: 'Get a player to tell you what superpower they would choose and why.'
  },
  {
    id: 'b007',
    text: 'Get a player to talk about a place they\'ve always dreamed of traveling to.'
  },
  {
    id: 'b008',
    text: 'Get a player to describe the most memorable meal they\'ve ever had.'
  },
  {
    id: 'b009',
    text: 'Get a player to share something they are genuinely proud of achieving.'
  },
  {
    id: 'b010',
    text: 'Get a player to talk about a book or movie that changed their perspective on something.'
  },
  {
    id: 'b011',
    text: 'Get a player to name three people (living or dead) they would invite to a dinner party.'
  },
  {
    id: 'b012',
    text: 'Get a player to talk about what they would do if they won the lottery.'
  },
  {
    id: 'b013',
    text: 'Get a player to tell you about their first-ever pet.'
  },
  {
    id: 'b014',
    text: 'Get a player to describe what their dream job would be, regardless of money or training.'
  },
  {
    id: 'b015',
    text: 'Get a player to talk about the best concert or live event they\'ve ever been to.'
  }
];

// Combined task pool
const allTasks: Task[] = [
  ...correctionTasks,
  ...verbalTasks,
  ...physicalTasks,
  ...performativeTasks,
  ...technologyTasks,
  ...connectionTasks
];

// Task Pack Definitions
const taskPacks: { [key: string]: TaskPack } = {
  'core-pack-a': {
    id: 'core-pack-a',
    name: 'Core Pack A',
    description: 'Complete collection of social challenge tasks',
    tasks: allTasks,
    difficulty: 'medium',
    minPlayers: 1,
    maxPlayers: 8
  }
};

// Helper function to get random tasks from a pack with guaranteed 1 bonus task
export function getRandomTasks(packId: string, count: number): Task[] {
  const pack = taskPacks[packId];
  if (!pack) return [];

  if (count <= 0) return [];

  // Separate regular tasks from bonus tasks
  const regularTasks = [
    ...correctionTasks,
    ...verbalTasks,
    ...physicalTasks,
    ...performativeTasks,
    ...technologyTasks
  ];
  
  // Always include 1 bonus task
  const shuffledBonusTasks = [...connectionTasks].sort(() => Math.random() - 0.5);
  const selectedBonus = shuffledBonusTasks.slice(0, 1);
  
  // Fill remaining slots with regular tasks
  const remainingCount = count - 1;
  const shuffledRegularTasks = [...regularTasks].sort(() => Math.random() - 0.5);
  const selectedRegular = shuffledRegularTasks.slice(0, remainingCount);
  
  // Combine and shuffle the final selection
  const finalTasks = [...selectedBonus, ...selectedRegular];
  return finalTasks.sort(() => Math.random() - 0.5);
}

// Helper function to get all packs
export function getAllPacks(): TaskPack[] {
  return Object.values(taskPacks);
}

// Helper function to get pack by ID
export function getPackById(id: string): TaskPack | undefined {
  return taskPacks[id];
} 