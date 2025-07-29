import { Task, TaskPack } from '../types';

// ================================
// CORE PACK - In-Person Game Tasks  
// ================================

// Category 1: Correction Tasks (10 Tasks)
const coreCorrectTasks: Task[] = [
  {
    id: 'c001',
    text: 'Get a player to correct a \'fact\' you stated. '
  },
  {
    id: 'c002',
    text: 'Get a player to correct your mispronunciation of a common word.'
  },
  {
    id: 'c003',
    text: 'Get a player to correct your movie quote. '
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
const coreVerbalTasks: Task[] = [
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
const corePhysicalTasks: Task[] = [
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
    text: 'Get a player take off their shoes.'
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
const corePerformativeTasks: Task[] = [
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
    text: 'Get a player to scratch your back for 10 seconds.'
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
    text: 'Get a player mention 3 ex presidents'
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
const coreTechnologyTasks: Task[] = [
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
const coreConnectionTasks: Task[] = [
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

// ================================
// REMOTE PACK - Virtual Game Tasks  
// ================================

// Remote pack tasks for virtual play
const remoteTasks: Task[] = [
  {
    id: 'r001',
    text: 'Get a player to send you a voice note.'
  },
  {
    id: 'r002',
    text: 'Get a player to send a selfie.'
  },
  {
    id: 'r003',
    text: 'Get a player to send a photo of their current view.'
  },
  {
    id: 'r004',
    text: 'Get a player to send a meme or reaction image.'
  },
  {
    id: 'r005',
    text: 'Get a player to forward you something funny.'
  },
  {
    id: 'r006',
    text: 'Get a player to send a TikTok or Reel.'
  },
  {
    id: 'r007',
    text: 'Get a player to react to one of your messages.'
  },
  {
    id: 'r008',
    text: 'Get a player to send you a music link or screenshot.'
  },
  {
    id: 'r009',
    text: 'Get a player to vote in your Instagram poll.'
  },
  {
    id: 'r010',
    text: 'Get a player to tag you in a post or comment.'
  },
  {
    id: 'r011',
    text: 'Get a player to message you on a different platform than usual.'
  },
  {
    id: 'r012',
    text: 'Get a player to send a screen recording.'
  },
  {
    id: 'r013',
    text: 'Get a player to send a screenshot of their phone.'
  },
  {
    id: 'r014',
    text: 'Get a player to change their profile picture.'
  },
  {
    id: 'r015',
    text: 'Get a player to send a photo of food they\'re eating.'
  },
  {
    id: 'r016',
    text: 'Get a player to send an old photo.'
  },
  {
    id: 'r017',
    text: 'Get a player to share their live location.'
  },
  {
    id: 'r018',
    text: 'Get a player to start a new group chat.'
  },
  {
    id: 'r019',
    text: 'Get a player to reply to one of your stories.'
  },
  {
    id: 'r020',
    text: 'Get a player to comment on one of your social posts.'
  },
  {
    id: 'r021',
    text: 'Get a player to send a photo or video with an animal in it.'
  },
  {
    id: 'r022',
    text: 'Get a player to use a silly filter and send it.'
  },
  {
    id: 'r023',
    text: 'Get a player to message while walking somewhere.'
  },
  {
    id: 'r024',
    text: 'Get a player to send a mirror selfie.'
  },
  {
    id: 'r025',
    text: 'Get a player to send a sticker as a reply.'
  },
  {
    id: 'r026',
    text: 'Get a player to double message you.'
  },
  {
    id: 'r027',
    text: 'Get a player to send a blurry photo.'
  },
  {
    id: 'r028',
    text: 'Get a player to send you a calendar invite.'
  },
  {
    id: 'r029',
    text: 'Get a player to send something and delete it.'
  },
  {
    id: 'r030',
    text: 'Get a player to send a screen recording of an app.'
  },
  {
    id: 'r031',
    text: 'Get a player to forward a tweet.'
  },
  {
    id: 'r032',
    text: 'Get a player to send you a voice note from outdoors.'
  },
  {
    id: 'r033',
    text: 'Get a player to like or heart your message.'
  },
  {
    id: 'r034',
    text: 'Get a player to join a video call and turn camera around.'
  },
  {
    id: 'r035',
    text: 'Get a player to send you a random emoji.'
  },
  {
    id: 'r036',
    text: 'Get a player to share their Spotify or YouTube.'
  },
  {
    id: 'r037',
    text: 'Get a player to screenshot your message and reply.'
  },
  {
    id: 'r038',
    text: 'Get a player to post something on their story after you mention it.'
  },
  {
    id: 'r039',
    text: 'Get a player to send something they\'re currently watching.'
  },
  {
    id: 'r040',
    text: 'Get a player to switch from texting to voice note.'
  },
  {
    id: 'r041',
    text: 'Get a player to message you while at a meal.'
  },
  {
    id: 'r042',
    text: 'Get a player to share a countdown or event.'
  },
  {
    id: 'r043',
    text: 'Get a player to forward you a poll.'
  },
  {
    id: 'r044',
    text: 'Get a player to comment something on your story.'
  },
  {
    id: 'r045',
    text: 'Get a player to screenshot their home screen and send it.'
  },
  {
    id: 'r046',
    text: 'Get a player to share a message from another group.'
  },
  {
    id: 'r047',
    text: 'Get a player to send you a funny typo or autocorrect.'
  },
  {
    id: 'r048',
    text: 'Get a player to message during a workout.'
  },
  {
    id: 'r049',
    text: 'Get a player to reply using only emojis.'
  },
  {
    id: 'r050',
    text: 'Get a player to send a pic of their workspace.'
  },
  {
    id: 'r051',
    text: 'Get a player to send a new post they\'re about to publish.'
  },
  {
    id: 'r052',
    text: 'Get a player to message you at midnight.'
  },
  {
    id: 'r053',
    text: 'Get a player to ask for your opinion using a picture.'
  },
  {
    id: 'r054',
    text: 'Get a player to forward you a voice note from another chat.'
  },
  {
    id: 'r055',
    text: 'Get a player to record a 2-second silent video and send it.'
  },
  {
    id: 'r056',
    text: 'Get a player to reply to your text instantly.'
  },
  {
    id: 'r057',
    text: 'Get a player to send a snap instead of a message.'
  },
  {
    id: 'r058',
    text: 'Get a player to change their WhatsApp status.'
  },
  {
    id: 'r059',
    text: 'Get a player to reply with a meme.'
  },
  {
    id: 'r060',
    text: 'Get a player to send a photo from their Notes app.'
  },
  {
    id: 'r061',
    text: 'Get a player to share something they\'re reading.'
  },
  {
    id: 'r062',
    text: 'Get a player to message you early in the morning.'
  },
  {
    id: 'r063',
    text: 'Get a player to draw something and send a photo of it.'
  },
  {
    id: 'r064',
    text: 'Get a player to reply with a Boomerang or Live Photo.'
  },
  {
    id: 'r065',
    text: 'Get a player to send a picture of their socks/shoes.'
  },
  {
    id: 'r066',
    text: 'Get a player to screen-record scrolling through social media.'
  },
  {
    id: 'r067',
    text: 'Get a player to send a message using voice-to-text.'
  },
  {
    id: 'r068',
    text: 'Get a player to screenshot a video frame and send it.'
  },
  {
    id: 'r069',
    text: 'Get a player to message you while in bed.'
  },
  {
    id: 'r070',
    text: 'Get a player to screenshot a weather app.'
  },
  {
    id: 'r071',
    text: 'Get a player to send a mood-related image.'
  },
  {
    id: 'r072',
    text: 'Get a player to message you while in public transport.'
  },
  {
    id: 'r073',
    text: 'Get a player to take and send a photo with flash.'
  },
  {
    id: 'r074',
    text: 'Get a player to reply while at work.'
  },
  {
    id: 'r075',
    text: 'Get a player to send a photo with sunglasses on.'
  },
  {
    id: 'r076',
    text: 'Get a player to message from an unfamiliar number or alt account.'
  },
  {
    id: 'r077',
    text: 'Get a player to share their to-do list.'
  },
  {
    id: 'r078',
    text: 'Get a player to forward you a private story screenshot.'
  },
  {
    id: 'r079',
    text: 'Get a player to post and delete something (you must see both).'
  },
  {
    id: 'r080',
    text: 'Get a player to send a selfie video.'
  },
  {
    id: 'r081',
    text: 'Get a player to switch devices mid-convo.'
  },
  {
    id: 'r082',
    text: 'Get a player to send you something while on a call.'
  },
  {
    id: 'r083',
    text: 'Get a player to send a weird photo from Google Images.'
  },
  {
    id: 'r084',
    text: 'Get a player to message during a meal and show the plate.'
  },
  {
    id: 'r085',
    text: 'Get a player to send a short screen recording (less than 3s).'
  },
  {
    id: 'r086',
    text: 'Get a player to reply to you while watching Netflix or YouTube.'
  },
  {
    id: 'r087',
    text: 'Get a player to scroll and screenshot a random DM.'
  },
  {
    id: 'r088',
    text: 'Get a player to send an "archive" photo (3+ years old).'
  },
  {
    id: 'r089',
    text: 'Get a player to message you while listening to music.'
  },
  {
    id: 'r090',
    text: 'Get a player to message you while in the dark.'
  },
  {
    id: 'r091',
    text: 'Get a player to send you a phone battery screenshot.'
  },
  {
    id: 'r092',
    text: 'Get a player to reply during a live event (sports, concert, etc.).'
  },
  {
    id: 'r093',
    text: 'Get a player to switch chat theme or background.'
  },
  {
    id: 'r094',
    text: 'Get a player to forward you a WhatsApp broadcast.'
  },
  {
    id: 'r095',
    text: 'Get a player to voice note while walking outside.'
  },
  {
    id: 'r096',
    text: 'Get a player to send a "just woke up" photo.'
  },
  {
    id: 'r097',
    text: 'Get a player to message while wearing headphones.'
  },
  {
    id: 'r098',
    text: 'Get a player to share a video with their own commentary.'
  },
  {
    id: 'r099',
    text: 'Get a player to send a photo of something on their desk.'
  },
  {
    id: 'r100',
    text: 'Get a player to send you a screengrab from an old video or story.'
  },
  {
    id: 'r101',
    text: 'Get a player to voice note you before 10 am.'
  },
  {
    id: 'r102',
    text: 'Get a player to send you a "good night".'
  },
  {
    id: 'r103',
    text: 'Get a player to ask you a question every day for 2 days.'
  },
  {
    id: 'r104',
    text: 'Get a player to call you two days in a row.'
  },
  {
    id: 'r105',
    text: 'Get a player to text you before 9am on 2 separate days.'
  },
  {
    id: 'r106',
    text: 'Get a player to send you a photo two days in a row.'
  },
  {
    id: 'r107',
    text: 'Get a player to tag you in stories twice within 48 hours.'
  },
  {
    id: 'r108',
    text: 'Get a player to reply to 3 of your stories.'
  },
  {
    id: 'r109',
    text: 'Get a player to send a new message within 60 seconds of your reply — 3x.'
  }
];

// ================================
// PACK DEFINITIONS
// ================================

export const gamePacks: { [key: string]: TaskPack } = {
  'core': {
    id: 'core',
    name: 'Core Pack',
    description: 'Default in-person game',
    tasks: [
      ...coreCorrectTasks,
      ...coreVerbalTasks, 
      ...corePhysicalTasks,
      ...corePerformativeTasks,
      ...coreTechnologyTasks,
      ...coreConnectionTasks
    ],
    difficulty: 'medium',
    minPlayers: 2,
    maxPlayers: 10
  },
  'remote': {
    id: 'remote',
    name: 'Remote Pack',
    description: 'Perfect when you\'re not together – play over WhatsApp, iMessage, and social media.',
    tasks: remoteTasks,
    difficulty: 'medium',
    minPlayers: 2,
    maxPlayers: 10
  }
};

// ================================
// HELPER FUNCTIONS
// ================================

// Get pack by ID
export function getPackById(packId: string): TaskPack | undefined {
  return gamePacks[packId];
}

// Get all available packs
export function getAllPacks(): TaskPack[] {
  return Object.values(gamePacks);
}

// Get tasks from a specific pack
export function getPackTasks(packId: string): Task[] {
  const pack = getPackById(packId);
  return pack ? pack.tasks : [];
}

// Get random tasks from a pack with guaranteed 1 bonus task (for Core pack)
export function getRandomTasks(packId: string, count: number): Task[] {
  const pack = getPackById(packId);
  if (!pack || count <= 0) return [];

  if (packId === 'core') {
    // Core pack logic: always include 1 bonus task
    const regularTasks = [
      ...coreCorrectTasks,
      ...coreVerbalTasks,
      ...corePhysicalTasks,
      ...corePerformativeTasks,
      ...coreTechnologyTasks
    ];
    
    // Always include 1 bonus task
    const shuffledBonusTasks = [...coreConnectionTasks].sort(() => Math.random() - 0.5);
    const selectedBonus = shuffledBonusTasks.slice(0, 1);
    
    // Fill remaining slots with regular tasks
    const remainingCount = count - 1;
    const shuffledRegularTasks = [...regularTasks].sort(() => Math.random() - 0.5);
    const selectedRegular = shuffledRegularTasks.slice(0, remainingCount);
    
    // Combine and shuffle the final selection
    const finalTasks = [...selectedBonus, ...selectedRegular];
    return finalTasks.sort(() => Math.random() - 0.5);
  } else {
    // Remote pack logic: random selection from all tasks
    const shuffledTasks = [...pack.tasks].sort(() => Math.random() - 0.5);
    return shuffledTasks.slice(0, count);
  }
}

// Helper function to get a replacement task for swapping (respects bonus task limit for Core pack)
export function getReplacementTask(packId: string, currentTasks: Task[], isSwappingBonusTask: boolean): Task | null {
  const pack = getPackById(packId);
  if (!pack) return null;

  if (packId === 'core') {
    // Core pack logic: maintain 1 bonus task rule
    const regularTasks = [
      ...coreCorrectTasks,
      ...coreVerbalTasks,
      ...corePhysicalTasks,
      ...corePerformativeTasks,
      ...coreTechnologyTasks
    ];

    // Check if player currently has a bonus task
    const hasBonusTask = currentTasks.some(task => coreConnectionTasks.some(bonus => bonus.id === task.id));
    
    // Get tasks the player doesn't already have
    const usedTaskIds = currentTasks.map(task => task.id);
    
    if (isSwappingBonusTask) {
      // Swapping away a bonus task - can get any type as replacement
      const availableRegular = regularTasks.filter(task => !usedTaskIds.includes(task.id));
      const availableBonus = coreConnectionTasks.filter(task => !usedTaskIds.includes(task.id));
      const allAvailable = [...availableRegular, ...availableBonus];
      
      if (allAvailable.length === 0) return null;
      return allAvailable[Math.floor(Math.random() * allAvailable.length)];
    } else {
      // Swapping a regular task
      if (hasBonusTask) {
        // Already has bonus task - only give regular tasks
        const availableRegular = regularTasks.filter(task => !usedTaskIds.includes(task.id));
        if (availableRegular.length === 0) return null;
        return availableRegular[Math.floor(Math.random() * availableRegular.length)];
      } else {
        // No bonus task yet - can give any type (but prefer regular to maintain 1 bonus rule)
        const availableRegular = regularTasks.filter(task => !usedTaskIds.includes(task.id));
        if (availableRegular.length === 0) {
          // Only bonus tasks left
          const availableBonus = coreConnectionTasks.filter(task => !usedTaskIds.includes(task.id));
          if (availableBonus.length === 0) return null;
          return availableBonus[Math.floor(Math.random() * availableBonus.length)];
        }
        return availableRegular[Math.floor(Math.random() * availableRegular.length)];
      }
    }
  } else {
    // Remote pack logic: simple random replacement
    const usedTaskIds = currentTasks.map(task => task.id);
    const availableTasks = pack.tasks.filter(task => !usedTaskIds.includes(task.id));
    
    if (availableTasks.length === 0) return null;
    return availableTasks[Math.floor(Math.random() * availableTasks.length)];
  }
}

// Helper function to check if a task is a bonus/connection task (Core pack only)
export function isBonusTask(packId: string, task: Task): boolean {
  if (packId === 'core') {
    return coreConnectionTasks.some(bonus => bonus.id === task.id);
  }
  return false; // Remote pack doesn't have bonus task concept
} 