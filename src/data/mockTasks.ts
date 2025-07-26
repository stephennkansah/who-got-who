import { Task, TaskPack } from '../types';

// Core Pack A - Stealth Tasks for Party Games
const corePackATasks: Task[] = [
  // Blame-Shift Gags
  {
    id: 'a001',
    text: 'Lightly tap a player on the back of the head and convince another player they did it',
    tips: 'Do it when both targets are close to each other'
  },
  {
    id: 'a002',
    text: 'Hide a small object in someone\'s pocket/bag and get a different player to "discover" it',
    tips: 'Use something harmless like a pen or coin'
  },
  {
    id: 'a003',
    text: 'Move a player\'s drink 10 cm and make them accuse someone else',
    tips: 'Do it when they\'re distracted and others are nearby'
  },
  {
    id: 'a004',
    text: 'Put something on a chair (napkin, coaster) so a player sits on it, then blame another',
    tips: 'Make sure the item is harmless and visible to others'
  },
  {
    id: 'a005',
    text: 'Get two players to apologise to each other for something neither did',
    tips: 'Create a minor misunderstanding and point fingers'
  },
  {
    id: 'a006',
    text: 'Make a player think another one borrowed their pen/phone when you did',
    tips: 'Quietly return it near the "accused" person'
  },
  {
    id: 'a007',
    text: 'Slip a sticker/post-it on a player and get someone else to point it out',
    tips: 'Use something harmless and easy to remove'
  },
  {
    id: 'a008',
    text: 'Swap two players\' identical items (coasters, pens) and get them to argue whose is whose',
    tips: 'Works best with items that look very similar'
  },
  {
    id: 'a009',
    text: 'Nudge a door almost closed and get someone else blamed for "locking" it',
    tips: 'Do it subtly when others are near the door'
  },
  {
    id: 'a010',
    text: 'Rearrange cutlery/remote and get a player to accuse another of being "tidy police"',
    tips: 'Make it look too perfect or organized'
  },
  
  // Music / Media Chaos
  {
    id: 'a011',
    text: 'Hum a song and get another player to put it on their phone',
    tips: 'Choose a catchy song that\'s easy to identify'
  },
  {
    id: 'a012',
    text: 'Get a player to skip a track you "don\'t like" without you touching the device',
    tips: 'Make a face or comment about the music'
  },
  {
    id: 'a013',
    text: 'Make someone change the TV/playlist volume twice in under a minute',
    tips: 'Complain it\'s too loud, then too quiet'
  },
  {
    id: 'a014',
    text: 'Get a player to put subtitles on/off',
    tips: 'Say you can\'t hear or that they\'re distracting'
  },
  {
    id: 'a015',
    text: 'Convince a player to rewind a video "to show someone else"',
    tips: 'Act like someone missed the best part'
  },
  {
    id: 'a016',
    text: 'Get a player to Shazam a song you start humming',
    tips: 'Hum something recognizable but not obvious'
  },
  {
    id: 'a017',
    text: 'Make someone open TikTok/Reels to "show you something" then they scroll for 30+ seconds',
    tips: 'Ask about a trend or funny video'
  },
  {
    id: 'a018',
    text: 'Get a player to cast/stream something to a screen',
    tips: 'Suggest watching something together'
  },
  {
    id: 'a019',
    text: 'Have someone delete a photo they just took because "it\'s not flattering"',
    tips: 'Be convincing about lighting or angles'
  },
  {
    id: 'a020',
    text: 'Get a player to change the group chat name/icon (even temporarily)',
    tips: 'Suggest something fun or seasonal'
  },

  // Set-Up Pranks
  {
    id: 'a021',
    text: 'Start clapping randomly and get one other player to join in',
    tips: 'Make it seem like you\'re celebrating something'
  },
  {
    id: 'a022',
    text: 'Pretend something smells odd; get a player to sniff around',
    tips: 'Be subtle and point to a general area'
  },
  {
    id: 'a023',
    text: 'Drop something "accidentally" and get someone to pick it up while you keep hands full',
    tips: 'Make sure your hands are obviously occupied'
  },
  {
    id: 'a024',
    text: 'Fake a phone vibration and get a player to check their phone thinking it\'s theirs',
    tips: 'Do it when phones are close together'
  },
  {
    id: 'a025',
    text: 'Balance an object on a player\'s shoulder and make someone else notice first',
    tips: 'Use something light and safe'
  },
  {
    id: 'a026',
    text: 'Put a cushion/coat on a player\'s seat and get someone else to "save" it for them',
    tips: 'Make it look like they\'re claiming the seat'
  },
  {
    id: 'a027',
    text: 'Plant a random item in the fridge/cupboard and get a player to find it',
    tips: 'Use something obviously out of place'
  },
  {
    id: 'a028',
    text: 'Start a slow clap and have exactly one player join before it dies',
    tips: 'Make eye contact with your target'
  },
  {
    id: 'a029',
    text: 'Switch two light switches fast; get a player to "fix the electrics"',
    tips: 'Act confused about which switch does what'
  },
  {
    id: 'a030',
    text: 'Place a chair slightly off-angle; get a player to straighten it twice',
    tips: 'Move it back after they fix it the first time'
  },

  // Physical but Safe / Silly
  {
    id: 'a031',
    text: 'Get a player to piggyback you for 3 steps',
    tips: 'Make it seem fun or claim you\'re tired'
  },
  {
    id: 'a032',
    text: 'Get someone to fan you with an object (menu, magazine)',
    tips: 'Complain about being hot or stuffy'
  },
  {
    id: 'a033',
    text: 'Make a player hold something over their head briefly',
    tips: 'Ask them to test if something fits or reaches'
  },
  {
    id: 'a034',
    text: 'Get someone to carry you across a tiny gap ("Don\'t let me touch the line!")',
    tips: 'Make it a playful challenge'
  },
  {
    id: 'a035',
    text: 'Have a player lift you onto/over something tiny (curb, rug)',
    tips: 'Act dramatically about the "obstacle"'
  },
  {
    id: 'a036',
    text: 'Get a player to balance an item on their head for "testing stability"',
    tips: 'Make it seem like a scientific experiment'
  },
  {
    id: 'a037',
    text: 'Make someone swap shoes with you for 10 seconds',
    tips: 'Claim you want to try theirs or compare sizes'
  },
  {
    id: 'a038',
    text: 'Get a player to spin you in a swivel chair',
    tips: 'Ask for help demonstrating something'
  },
  {
    id: 'a039',
    text: 'Make someone "measure" your arm span against theirs',
    tips: 'Start a conversation about height or reach'
  },
  {
    id: 'a040',
    text: 'Get a player to crouch so you can "compare height properly"',
    tips: 'Claim they seem taller than you thought'
  },

  // Object Tricks
  {
    id: 'a041',
    text: 'Slip a spoon/fork/pen into a player\'s pocket/hood and later retrieve it unnoticed',
    tips: 'Do both actions when they\'re distracted'
  },
  {
    id: 'a042',
    text: 'Get someone to open a closed umbrella indoors "just to check if it works"',
    tips: 'Express concern about broken umbrellas'
  },
  {
    id: 'a043',
    text: 'Make a player test two pens to see which writes smoother',
    tips: 'Ask for their expert opinion'
  },
  {
    id: 'a044',
    text: 'Hide an object under a cushion and get a player to find it by sitting/pressing',
    tips: 'Use something they\'ll feel but won\'t hurt'
  },
  {
    id: 'a045',
    text: 'Get someone to untangle fairy lights/cords you "found"',
    tips: 'Claim you\'re terrible at untangling things'
  },
  {
    id: 'a046',
    text: 'Make a player balance two items on top of each other for you',
    tips: 'Ask for help creating a "tower" or stack'
  },
  {
    id: 'a047',
    text: 'Get a player to peel the label off a bottle cleanly',
    tips: 'Claim it\'s bothering you or looks messy'
  },
  {
    id: 'a048',
    text: 'Make someone line up three objects perfectly parallel',
    tips: 'Ask for help making things "look neat"'
  },
  {
    id: 'a049',
    text: 'Get a player to swap the batteries in a remote (even if not needed)',
    tips: 'Claim it seems slow or unresponsive'
  },
  {
    id: 'a050',
    text: 'Make someone clean a tiny smudge off a screen/window you point out',
    tips: 'Point it out like it\'s really bothering you'
  },

  // Social/Behavioral Traps
  {
    id: 'a051',
    text: 'Get a player to shush you with their finger',
    tips: 'Be slightly too loud at the right moment'
  },
  {
    id: 'a052',
    text: 'Make someone tap you twice to get your attention',
    tips: 'Pretend to be deeply focused on something'
  },
  {
    id: 'a053',
    text: 'Get a player to block another player\'s path "jokingly"',
    tips: 'Start a playful interaction between them'
  },
  {
    id: 'a054',
    text: 'Make someone do a "cheers" with only you and no one else',
    tips: 'Make it seem like a private celebration'
  },
  {
    id: 'a055',
    text: 'Get a player to mimic a dance move you start',
    tips: 'Make it look fun and easy to copy'
  },
  {
    id: 'a056',
    text: 'Make someone cover their ears (loud noise excuse)',
    tips: 'React dramatically to a sound first'
  },
  {
    id: 'a057',
    text: 'Get a player to hold your wrist to "check your pulse"',
    tips: 'Claim you feel weird or want to test something'
  },
  {
    id: 'a058',
    text: 'Make someone trace a shape on your palm with their finger',
    tips: 'Start a conversation about palm reading or guessing games'
  },
  {
    id: 'a059',
    text: 'Get a player to swap seats with another person at your request',
    tips: 'Give a reason like better view or conversation'
  },
  {
    id: 'a060',
    text: 'Make someone pass an item to a third player "because your hands are full"',
    tips: 'Make sure your hands are obviously occupied'
  },
  {
    id: 'a061',
    text: 'Get a player to shield your eyes from light with their hand/object',
    tips: 'Complain about glare or brightness'
  },
  {
    id: 'a062',
    text: 'Make someone spin an object on a table for you',
    tips: 'Act like you\'re testing if it spins well'
  },
  {
    id: 'a063',
    text: 'Get a player to pick lint off your clothes',
    tips: 'Point it out like it\'s really bothering you'
  },
  {
    id: 'a064',
    text: 'Make someone adjust your chair height',
    tips: 'Complain about being too high or low'
  },
  {
    id: 'a065',
    text: 'Get a player to test two different chairs and give a verdict',
    tips: 'Ask for their expert opinion on comfort'
  },
  {
    id: 'a066',
    text: 'Make someone untie a knot you made',
    tips: 'Claim you tied it too tight by accident'
  },
  {
    id: 'a067',
    text: 'Get a player to move closer to hear you, then move them back again',
    tips: 'Start whispering, then speak normally'
  },
  {
    id: 'a068',
    text: 'Make someone check if your phone camera is smudged',
    tips: 'Complain about blurry photos'
  },
  {
    id: 'a069',
    text: 'Get a player to hold something behind their back "so no one sees"',
    tips: 'Make it seem secretive or surprising'
  },
  {
    id: 'a070',
    text: 'Make someone balance a coin/card on their finger for you',
    tips: 'Ask them to demonstrate their balance skills'
  },

  // Blame/Chaos Part 2
  {
    id: 'a071',
    text: 'Nudge a player\'s bag/coat to fall; get someone else to pick it up and take blame',
    tips: 'Do it when multiple people are nearby'
  },
  {
    id: 'a072',
    text: 'Swap two players\' seats while one is away and get them to blame the other',
    tips: 'Act innocent when they return'
  },
  {
    id: 'a073',
    text: 'Put a funny GIF/meme on a shared screen and make someone else responsible',
    tips: 'Act surprised when it appears'
  },
  {
    id: 'a074',
    text: 'Rearrange the order of snacks and get a player accused of hogging',
    tips: 'Make it look like someone took more than their share'
  },
  {
    id: 'a075',
    text: 'Turn on/off a device (lamp, speaker) and pin it on someone else',
    tips: 'Do it when they\'re near the device'
  },
  {
    id: 'a076',
    text: 'Move a player\'s phone to a weird spot; make them assume another did it',
    tips: 'Put it somewhere obviously out of place'
  },
  {
    id: 'a077',
    text: '"Borrow" a pen/glass then leave it with another player; owner blames them',
    tips: 'Make the transfer look natural'
  },
  {
    id: 'a078',
    text: 'Put a note "Kick me" style (PG version) and get a third player to remove it',
    tips: 'Use something harmless and funny'
  },
  {
    id: 'a079',
    text: 'Text from someone\'s phone to another player (with consent IRL) and let chaos happen',
    tips: 'Make sure they\'re okay with the prank first'
  },
  {
    id: 'a080',
    text: 'Hide the remote, reveal it, and frame another player for hiding it',
    tips: 'Act like you just found their "hiding spot"'
  },

  // Quick Oddities
  {
    id: 'a081',
    text: 'Get a player to smell two things and choose "which is fresher"',
    tips: 'Use safe items like different drinks or snacks'
  },
  {
    id: 'a082',
    text: 'Make someone pick a random number from a bowl you prepared',
    tips: 'Make it seem like an important decision'
  },
  {
    id: 'a083',
    text: 'Get a player to choose left/right hand to "win" something imaginary',
    tips: 'Build suspense about the "prize"'
  },
  {
    id: 'a084',
    text: 'Make someone draw a quick map of the room/area for you',
    tips: 'Claim you need it for directions or planning'
  },
  {
    id: 'a085',
    text: 'Get a player to knock on a table/door twice "for luck"',
    tips: 'Start a superstition or tradition'
  },
  {
    id: 'a086',
    text: 'Make someone flick a light switch to the beat of music',
    tips: 'Start doing it yourself first'
  },
  {
    id: 'a087',
    text: 'Get a player to mark something invisible on your hand with a pen',
    tips: 'Claim you need to remember something important'
  },
  {
    id: 'a088',
    text: 'Make someone test if a chair wobbles by sitting and rocking',
    tips: 'Express concern about furniture stability'
  },
  {
    id: 'a089',
    text: 'Get a player to check inside an empty box/bag for "the thing"',
    tips: 'Act like something important should be there'
  },
  {
    id: 'a090',
    text: 'Make someone hold two objects and decide which "feels heavier" blind',
    tips: 'Make it seem like a scientific test'
  },

  // Misdirection Minis
  {
    id: 'a091',
    text: 'Drop a coin and get a player to pick it up while you pretend not to notice',
    tips: 'Act distracted or focused on something else'
  },
  {
    id: 'a092',
    text: 'Put an elastic band on a doorknob and get someone to "fix it"',
    tips: 'Make it look like it got stuck there accidentally'
  },
  {
    id: 'a093',
    text: 'Leave a tap running slightly and get a player to turn it off',
    tips: 'Act like you didn\'t notice the waste'
  },
  {
    id: 'a094',
    text: 'Hide a spoon in a plant pot; get someone to "water/check it" and find it',
    tips: 'Make them want to care for the plant'
  },
  {
    id: 'a095',
    text: 'Put an object under a cushion and later ask someone else to sit there',
    tips: 'Make sure it\'s something they\'ll feel but won\'t hurt'
  },
  {
    id: 'a096',
    text: 'Swap salt/sugar packets\' positions; get a player to swap them back',
    tips: 'Comment on organization or proper placement'
  },
  {
    id: 'a097',
    text: 'Place two identical items; move one slightly and get a player to align them',
    tips: 'Point out that something "looks off"'
  },
  {
    id: 'a098',
    text: 'Pretend your sleeve is stuck; get someone to free it',
    tips: 'Act genuinely frustrated with the "problem"'
  },
  {
    id: 'a099',
    text: 'Jam a zip slightly; get a player to unjam it for you',
    tips: 'Ask for help with your "broken" zipper'
  },
  {
    id: 'a100',
    text: 'Set two chairs almost touching; get a player to separate them "for space"',
    tips: 'Comment about needing more room to move'
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