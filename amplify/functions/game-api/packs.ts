import type { Task, TaskPack, Challenge, HolidayChallengePack } from '../../../src/types';

// ================================
// CORE PACK - In-Person Game Tasks
// ================================
//
// Every task carries a one-line `tips` hint: a natural way to set the task
// up without giving it away. Keep ids stable — live games store them as
// `templateId`. Retired ids (do not reuse): v012, v020, v029, p009, p026.

// Category 1: Correction Tasks (13 Tasks)
const coreCorrectTasks: Task[] = [
  {
    id: 'c001',
    text: 'Get a player to correct a wrong "fact" you state.',
    tips: 'Pick a topic they love and get one detail wrong with total confidence.'
  },
  {
    id: 'c002',
    text: 'Get a player to correct your mispronunciation of a common word.',
    tips: 'Say "expresso" or "pacifically" like you mean it, then wait.'
  },
  {
    id: 'c003',
    text: 'Get a player to correct you when you misquote a movie.',
    tips: 'Say "Peter, I am your father" and wait for the correction.'
  },
  {
    id: 'c004',
    text: 'Get a player to correct you when you get a song lyric wrong.',
    tips: 'Sing a famous chorus with one word swapped and keep going.'
  },
  {
    id: 'c005',
    text: 'Get a player to correct you on a celebrity\'s name.',
    tips: 'Rave about "Ryan Reynolds in La La Land" and wait for "Gosling!"'
  },
  {
    id: 'c006',
    text: 'Get a player to correct a detail you get wrong about a memory you share.',
    tips: 'Retell a shared story with the wrong place, year or friend in it.'
  },
  {
    id: 'c007',
    text: 'Get a player to tell you the real name of an object you can\'t seem to name.',
    tips: 'Ask them to pass "the clicker-majig" and wait for "The remote?"'
  },
  {
    id: 'c008',
    text: 'Get a player to correct you on the current day, date, or time.',
    tips: 'Say "Can\'t believe it\'s only Tuesday" when it\'s Wednesday.'
  },
  {
    id: 'c009',
    text: 'Get a player to correct the spelling of a word you spell out loud.',
    tips: 'Ask "How do you spell that? Isn\'t it...?" and spell it wrong.'
  },
  {
    id: 'c010',
    text: 'Get a player to correct you on the rules of a different game or sport.',
    tips: 'Wonder aloud: "In chess the queen can jump like a knight, right?"'
  },
  {
    id: 'c011',
    text: 'Get a player to correct your maths.',
    tips: 'Get the bill split, the tip or the score slightly wrong out loud.'
  },
  {
    id: 'c012',
    text: 'Get a player to show you the "right" way to do something you\'re doing wrong.',
    tips: 'Peel a banana from the wrong end or hold your glass oddly.'
  },
  {
    id: 'c013',
    text: 'Get a player to correct you when you call them by the wrong name.',
    tips: 'Call them by a friend\'s or sibling\'s name, the way parents do.'
  }
];

// Category 2: Verbal & Conversational (33 Tasks)
const coreVerbalTasks: Task[] = [
  {
    id: 'v001',
    text: 'Get a player to say "delicious."',
    tips: 'Offer them a bite of something and ask how it is.'
  },
  {
    id: 'v002',
    text: 'Get a player to say "nightmare."',
    tips: 'Ask about their worst journey, flight or neighbour.'
  },
  {
    id: 'v003',
    text: 'Get a player to say "good question."',
    tips: 'Ask something thoughtful they\'ll need a moment to answer.'
  },
  {
    id: 'v004',
    text: 'Get a player to say "that\'s crazy."',
    tips: 'Share a wild (but true) fact or story and pause for the reaction.'
  },
  {
    id: 'v005',
    text: 'Get a player to say "one hundred percent."',
    tips: 'Ask "Are you sure?" about something they clearly feel strongly about.'
  },
  {
    id: 'v006',
    text: 'Get a player to thank you for something you didn\'t do.',
    tips: 'Say "I saved you the last slice" or "I topped up your drink" and see if they buy it.'
  },
  {
    id: 'v007',
    text: 'Get a player to say your name twice within one minute.',
    tips: 'Ask two quick "Who\'s better at this, me or...?" questions back to back.'
  },
  {
    id: 'v008',
    text: 'Get a player to say their own name.',
    tips: 'Ask how baristas usually misspell their name.'
  },
  {
    id: 'v009',
    text: 'Get a player to say "you\'re right."',
    tips: 'Win a tiny argument and wait for them to admit it.'
  },
  {
    id: 'v010',
    text: 'Get a player to ask you for your opinion.',
    tips: 'Pull a face at something they said and wait for "What do you think?"'
  },
  {
    id: 'v011',
    text: 'Get a player to start a show of hands.',
    tips: 'Start a debate that splits the room; someone will say "Hands up who..."'
  },
  {
    id: 'v013',
    text: 'Get a player to give someone else a compliment.',
    tips: 'Ask what they think of someone\'s outfit or haircut tonight.'
  },
  {
    id: 'v014',
    text: 'Get a player to make a friendly bet with you.',
    tips: 'Make a bold prediction and offer a silly forfeit if you\'re wrong.'
  },
  {
    id: 'v015',
    text: 'Get a player to make an animal noise.',
    tips: 'Ask what noise a giraffe or a fox makes.'
  },
  {
    id: 'v016',
    text: 'Get a player to rate something out of 10.',
    tips: 'Ask how they\'d score the food, the music or your outfit.'
  },
  {
    id: 'v017',
    text: 'Get a player to name their guilty-pleasure song.',
    tips: 'Confess your own cheesy favourite first.'
  },
  {
    id: 'v018',
    text: 'Get a player to name a film they think is overrated.',
    tips: 'Say a hugely popular film was "just okay" and ask if they agree.'
  },
  {
    id: 'v019',
    text: 'Get a player to talk about a dream they had.',
    tips: 'Say "I had the weirdest dream last night" and ask if they get strange ones.'
  },
  {
    id: 'v021',
    text: 'Get a player to complain about traffic or transport.',
    tips: 'Ask how their journey here was.'
  },
  {
    id: 'v022',
    text: 'Get a player to ask what a word means.',
    tips: 'Drop an unusual word like "petrichor" or "defenestrate" into conversation.'
  },
  {
    id: 'v023',
    text: 'Get a player to tell you about a holiday that went wrong.',
    tips: 'Share your own travel disaster first and ask if they can top it.'
  },
  {
    id: 'v024',
    text: 'Get a player to answer five questions in a row about their job.',
    tips: 'Act genuinely curious and keep the follow-ups coming before they notice.'
  },
  {
    id: 'v025',
    text: 'Get a player to defend an unpopular opinion.',
    tips: 'Ask for their most controversial food opinion, then push back.'
  },
  {
    id: 'v026',
    text: 'Get a player to ask someone to repeat themselves.',
    tips: 'Mumble the end of a sentence, or speak just as the music gets loud.'
  },
  {
    id: 'v027',
    text: 'Get a player to quote a line from any movie.',
    tips: 'Set up a famous line, "Houston, we have...", and let them finish it.'
  },
  {
    id: 'v028',
    text: 'Get a player to say "Are you serious?"',
    tips: 'Announce something unbelievable, like a crazy price or that you\'ve never seen Star Wars.'
  },
  {
    id: 'v030',
    text: 'Get a player to start a sentence with "No offense, but..."',
    tips: 'Ask for their honest opinion of your outfit or music taste.'
  },
  {
    id: 'v031',
    text: 'Get a player to give you a nickname.',
    tips: 'Complain you\'ve never had a nickname and ask what yours should be.'
  },
  {
    id: 'v032',
    text: 'Get a player to finish your sentence.',
    tips: 'Start a well-known saying and trail off: "The early bird..."'
  },
  {
    id: 'v033',
    text: 'Get a player to make you a promise.',
    tips: 'Ask "Promise you\'ll come to my thing next month?"'
  },
  {
    id: 'v034',
    text: 'Get a player to use a word you made up.',
    tips: 'Slip your new word into conversation a few times until it catches on.'
  },
  {
    id: 'v035',
    text: 'Get a player to tell you their star sign.',
    tips: 'Guess their star sign wrong on purpose.'
  },
  {
    id: 'v036',
    text: 'Get a player to argue with you about whether a hot dog is a sandwich.',
    tips: 'State your side as if it\'s obvious and wait for them to bite.'
  }
];

// Category 3: Physical & Interactive (33 Tasks)
const corePhysicalTasks: Task[] = [
  {
    id: 'p001',
    text: 'Get a player to pour you a drink.',
    tips: 'Hold out your empty glass while you\'re in the middle of a story.'
  },
  {
    id: 'p002',
    text: 'Get a player to yawn.',
    tips: 'Do a big, slow yawn yourself. Yawns are contagious.'
  },
  {
    id: 'p003',
    text: 'Get a player to stretch their arms.',
    tips: 'Stretch yourself and complain about how stiff you are.'
  },
  {
    id: 'p004',
    text: 'Get a player to swap seats with you.',
    tips: 'Say you can\'t hear from where you are, or the light is in your eyes.'
  },
  {
    id: 'p005',
    text: 'Get a player to hold something for you for 20 seconds.',
    tips: 'Hand them your drink or plate while you "check your pockets".'
  },
  {
    id: 'p006',
    text: 'Get a player to wink at you.',
    tips: 'Admit you can\'t wink properly and ask if they can.'
  },
  {
    id: 'p007',
    text: 'Get a player to look up at the ceiling.',
    tips: 'Look up and ask "Is that a spider up there?"'
  },
  {
    id: 'p008',
    text: 'Get a player to point at you.',
    tips: 'Ask "Who here is most likely to get lost on holiday?"'
  },
  {
    id: 'p010',
    text: 'Get a player to take off or put on a jacket or jumper.',
    tips: 'Say it\'s getting chilly, or that it\'s boiling in here.'
  },
  {
    id: 'p011',
    text: 'Get a player to pass you something that\'s right next to you.',
    tips: 'Ask for something within your own reach while you look busy.'
  },
  {
    id: 'p012',
    text: 'Get a player to pick something up that was dropped.',
    tips: 'Drop a napkin or bottle cap near them and keep talking.'
  },
  {
    id: 'p013',
    text: 'Get a player to fetch something for you from another room.',
    tips: 'Say you left your charger or jumper in the other room.'
  },
  {
    id: 'p014',
    text: 'Get a player to adjust their chair.',
    tips: 'Ask them to scoot over to make room for you.'
  },
  {
    id: 'p015',
    text: 'Get a player to put their phone face down on the table.',
    tips: 'Put yours face down first and grumble about screen time.'
  },
  {
    id: 'p016',
    text: 'Get a player to lend you something from their pocket or bag.',
    tips: 'Ask if anyone has a pen, lip balm or a mint.'
  },
  {
    id: 'p017',
    text: 'Get a player to adjust something they\'re wearing (glasses, hat, collar or sleeves).',
    tips: 'Tell them their collar or glasses look a bit wonky.'
  },
  {
    id: 'p018',
    text: 'Get a player to check or tie their shoelaces.',
    tips: 'Tell them their lace looks undone.'
  },
  {
    id: 'p019',
    text: 'Get a player to look at their reflection.',
    tips: 'Tell them they might have something on their face or in their teeth.'
  },
  {
    id: 'p020',
    text: 'Get a player to clink glasses in a "cheers."',
    tips: 'Propose a toast to something small: the weekend, the snacks.'
  },
  {
    id: 'p021',
    text: 'Get a player to give you a high-five.',
    tips: 'Celebrate a tiny win with your hand already up.'
  },
  {
    id: 'p022',
    text: 'Get a player to give you a thumbs-up.',
    tips: 'Ask from across the room if they want another drink.'
  },
  {
    id: 'p023',
    text: 'Get a player to make up a secret handshake with you.',
    tips: 'Say every good team needs a handshake and start one off.'
  },
  {
    id: 'p024',
    text: 'Get a player to give you a shoulder massage for 10 seconds.',
    tips: 'Roll your shoulders and moan about how stiff your neck is.'
  },
  {
    id: 'p025',
    text: 'Get a player to whisper something to you.',
    tips: 'Whisper a bit of gossip to them first and wait for them to whisper back.'
  },
  {
    id: 'p027',
    text: 'Get a player to offer you their seat.',
    tips: 'Hover nearby with a full plate, or mention your aching feet.'
  },
  {
    id: 'p028',
    text: 'Get a player to check the time on their phone for you.',
    tips: 'Say your phone just died and ask what time it is.'
  },
  {
    id: 'p029',
    text: 'Get two players to point at the same object at the same time.',
    tips: 'Ask the group "Whose is that?" about something on the table.'
  },
  {
    id: 'p030',
    text: 'Get a player to take a photo of you.',
    tips: 'Hand them your phone and say you need a new profile picture.'
  },
  {
    id: 'p031',
    text: 'Get a player to try on something of yours (hat, sunglasses or jacket).',
    tips: 'Say "This would look better on you" and hand it over.'
  },
  {
    id: 'p032',
    text: 'Get a player to balance something on their head.',
    tips: 'Balance a coaster on yours and say nobody can beat 10 seconds.'
  },
  {
    id: 'p033',
    text: 'Get a player to stand on one leg.',
    tips: 'Mention a balance test you saw online and try it yourself.'
  },
  {
    id: 'p034',
    text: 'Get a player to try to lick their elbow.',
    tips: 'Claim it\'s impossible to lick your own elbow.'
  },
  {
    id: 'p035',
    text: 'Get a player to fix something on you (a tag, your collar or your hair).',
    tips: 'Leave your label sticking out and wait for them to tuck it in.'
  }
];

// Category 4: Funny & Performative (20 Tasks)
const corePerformativeTasks: Task[] = [
  {
    id: 'f001',
    text: 'Get a player to tell a bad joke.',
    tips: 'Tell a terrible pun and say "Bet you can\'t top that."'
  },
  {
    id: 'f002',
    text: 'Get a player to sing a line from any song.',
    tips: 'Start a famous song and "forget" the next line.'
  },
  {
    id: 'f003',
    text: 'Get a player to hum a tune.',
    tips: 'Ask how a song goes when you can\'t remember its name.'
  },
  {
    id: 'f004',
    text: 'Get a player to do an impression of someone.',
    tips: 'Bring up a famous voice and say nobody can do it.'
  },
  {
    id: 'f005',
    text: 'Get a player to talk in a different accent for a full sentence.',
    tips: 'Ask how someone from another country would say what they just said.'
  },
  {
    id: 'f006',
    text: 'Get a player to say a tongue twister.',
    tips: 'Stumble over "red lorry, yellow lorry" and ask if they can do it.'
  },
  {
    id: 'f007',
    text: 'Get a player to mime an action, like swinging a bat.',
    tips: 'Ask them to show you their golf swing or how they\'d cast a fishing line.'
  },
  {
    id: 'f008',
    text: 'Get a player to scratch your back for 10 seconds.',
    tips: 'Squirm and say casually "My back is killing me. Can you get that spot?"'
  },
  {
    id: 'f009',
    text: 'Get a player to start a slow clap.',
    tips: 'Do something mildly impressive, then pause like you\'re waiting for applause.'
  },
  {
    id: 'f010',
    text: 'Get a player to propose a ridiculous "would you rather" question.',
    tips: 'Ask a "would you rather" yourself, then say "Your turn."'
  },
  {
    id: 'f011',
    text: 'Get a player to demonstrate a dance move.',
    tips: 'Ask if they remember how a dance craze from school went.'
  },
  {
    id: 'f012',
    text: 'Get a player to show you a party trick or hidden talent.',
    tips: 'Show off a small trick of your own and ask "What\'s yours?"'
  },
  {
    id: 'f013',
    text: 'Get a player to say something in a different language.',
    tips: 'Ask how to order a drink in a language they learned at school.'
  },
  {
    id: 'f014',
    text: 'Get a player to take a bow.',
    tips: 'Applaud loudly when they finish a story or win at something.'
  },
  {
    id: 'f015',
    text: 'Get a player to tell you that you\'re funny.',
    tips: 'Land a good joke, then ask "Was that not funny?"'
  },
  {
    id: 'f016',
    text: 'Get a player to count down from ten.',
    tips: 'Suggest a countdown for a photo, a toast or a dare.'
  },
  {
    id: 'f017',
    text: 'Get a player to act out a slow-motion replay of something that just happened.',
    tips: 'Say "Wait, do that again in slow motion!"'
  },
  {
    id: 'f018',
    text: 'Get a player to narrate something in the room like a nature documentary.',
    tips: 'Start whispering like a wildlife presenter about the snacks, then hand over.'
  },
  {
    id: 'f019',
    text: 'Get a player to do their best evil laugh.',
    tips: 'Do a terrible one yourself and say "Bet you can\'t do better."'
  },
  {
    id: 'f020',
    text: 'Get a player to make up a rhyme about the party or the host.',
    tips: 'Start a rhyme and leave the last line for them.'
  }
];

// Category 5: Technology & Meta-Game (16 Tasks)
const coreTechnologyTasks: Task[] = [
  {
    id: 't001',
    text: 'Get a player to take a group selfie.',
    tips: 'Say "We never get photos together" when the lighting is good.'
  },
  {
    id: 't002',
    text: 'Get a player to show someone a meme on their phone.',
    tips: 'Mention a meme that\'s going around and say you can\'t find it.'
  },
  {
    id: 't003',
    text: 'Get a player to tell you their battery percentage.',
    tips: 'Complain your phone is dying and ask "How much have you got?"'
  },
  {
    id: 't004',
    text: 'Get a player to show you a photo on their phone.',
    tips: 'Ask to see their pet, their last holiday or something they cooked.'
  },
  {
    id: 't005',
    text: 'Get a player to use their phone\'s flashlight.',
    tips: 'Ask for help reading tiny print on a label or menu.'
  },
  {
    id: 't006',
    text: 'Get a player to text you while you\'re in the same room.',
    tips: 'Ask them to send you a link or photo they just mentioned.'
  },
  {
    id: 't007',
    text: 'Get a player to look something up on their phone to settle a debate.',
    tips: 'Make a confident claim about a fact and refuse to back down.'
  },
  {
    id: 't008',
    text: 'Get a player to tell you how many points they have.',
    tips: 'Joke that you\'re doing so badly you need to know who to copy.'
  },
  {
    id: 't009',
    text: 'Get a player to ask who is winning.',
    tips: 'Groan about your own score and say "I bet someone\'s miles ahead."'
  },
  {
    id: 't010',
    text: 'Get a player to ask for a rule to be explained.',
    tips: 'Get a rule slightly wrong out loud so they want to check it.'
  },
  {
    id: 't011',
    text: 'Get a player to say "I knew it!" after a task is revealed.',
    tips: 'Act a bit suspicious around them, then call your Gotcha.'
  },
  {
    id: 't012',
    text: 'Get a player to accuse you of doing a task when you aren\'t.',
    tips: 'Do something oddly specific for no reason and let them get suspicious.'
  },
  {
    id: 't013',
    text: 'Get a player to arm wrestle you.',
    tips: 'Brag about how strong you are and wait for them to call your bluff.'
  },
  {
    id: 't014',
    text: 'Get a player to recommend a social media creator.',
    tips: 'Say your feed is boring and ask who you should follow.'
  },
  {
    id: 't015',
    text: 'Get a player to play a song you ask for.',
    tips: 'Say "Put on that song, you know the one..." and hum it badly.'
  },
  {
    id: 't016',
    text: 'Get a player to set a timer or alarm on their phone.',
    tips: 'Say the food needs ten minutes and you\'ll definitely forget.'
  }
];

// Bonus Category: Connection & Storytelling (15 Tasks)
const coreConnectionTasks: Task[] = [
  {
    id: 'b001',
    text: 'Get a player to describe their "perfect" day, from start to finish.',
    tips: 'Describe your own perfect lazy Sunday, then ask about theirs.'
  },
  {
    id: 'b002',
    text: 'Get a player to talk about a skill they\'ve always wanted to learn.',
    tips: 'Mention a class you\'ve thought about taking and ask what they\'d sign up for.'
  },
  {
    id: 'b003',
    text: 'Get a player to tell you about their favourite childhood memory.',
    tips: 'Share a small memory of your own first: a summer, a birthday, a trip.'
  },
  {
    id: 'b004',
    text: 'Get a player to share a story about a time they got in big trouble as a kid.',
    tips: 'Confess a childhood crime of your own and ask if they can beat it.'
  },
  {
    id: 'b005',
    text: 'Get a player to describe the best advice they have ever received.',
    tips: 'Share advice that stuck with you and ask about theirs.'
  },
  {
    id: 'b006',
    text: 'Get a player to tell you what superpower they would choose and why.',
    tips: 'Complain about your journey and say teleporting would fix everything.'
  },
  {
    id: 'b007',
    text: 'Get a player to talk about a place they\'ve always dreamed of travelling to.',
    tips: 'Ask where they\'d go with a free plane ticket.'
  },
  {
    id: 'b008',
    text: 'Get a player to describe the most memorable meal they\'ve ever had.',
    tips: 'Rave about something you\'re eating and ask about the best meal they\'ve had.'
  },
  {
    id: 'b009',
    text: 'Get a player to share something they are genuinely proud of achieving.',
    tips: 'Ask what the highlight of their year has been so far.'
  },
  {
    id: 'b010',
    text: 'Get a player to talk about a book or movie that changed their perspective on something.',
    tips: 'Talk about something you watched or read that stuck with you.'
  },
  {
    id: 'b011',
    text: 'Get a player to name three people (living or dead) they would invite to a dinner party.',
    tips: 'Ask who they\'d want at their table if they could invite anyone, ever.'
  },
  {
    id: 'b012',
    text: 'Get a player to talk about what they would do if they won the lottery.',
    tips: 'Mention this week\'s jackpot and wonder what you\'d do with it.'
  },
  {
    id: 'b013',
    text: 'Get a player to tell you about their first pet, or the pet they always wanted.',
    tips: 'Talk about an animal you had (or wanted) growing up and ask about theirs.'
  },
  {
    id: 'b014',
    text: 'Get a player to describe what their dream job would be, regardless of money or training.',
    tips: 'Ask what they wanted to be when they were seven.'
  },
  {
    id: 'b015',
    text: 'Get a player to talk about the best concert or live event they\'ve ever been to.',
    tips: 'Mention a gig or match you want tickets for.'
  }
];

// ================================
// REMOTE PACK - Virtual Game Tasks
// ================================

// Remote pack tasks for virtual play. Nothing here should ask a player to
// share other people's messages or stories, their live location, or another
// person's device. Retired ids (do not reuse): r076, r078, r087.
const remoteTasks: Task[] = [
  {
    id: 'r001',
    text: 'Get a player to send you a voice note.',
    tips: 'Send them a voice note first. People usually reply in kind.'
  },
  {
    id: 'r002',
    text: 'Get a player to send a selfie.',
    tips: 'Send a selfie of your own and ask "What are you up to?"'
  },
  {
    id: 'r003',
    text: 'Get a player to send a photo of their current view.',
    tips: 'Send your view first and ask "What\'s yours looking like?"'
  },
  {
    id: 'r004',
    text: 'Get a player to send a meme or reaction image.',
    tips: 'Tell them something outrageous that deserves a reaction pic.'
  },
  {
    id: 'r005',
    text: 'Get a player to forward you something funny they saw online.',
    tips: 'Say you\'re bored and need something to laugh at.'
  },
  {
    id: 'r006',
    text: 'Get a player to send a TikTok or Reel.',
    tips: 'Say your feed has been terrible lately and ask for anything good.'
  },
  {
    id: 'r007',
    text: 'Get a player to react to one of your messages.',
    tips: 'Send big news or a great photo that deserves a reaction.'
  },
  {
    id: 'r008',
    text: 'Get a player to send you a link to a song.',
    tips: 'Ask what they\'ve had on repeat this week.'
  },
  {
    id: 'r009',
    text: 'Get a player to suggest a question for a group poll.',
    tips: 'Say you want to settle a debate in the chat but need a good question.'
  },
  {
    id: 'r010',
    text: 'Get a player to tag you in a post or comment.',
    tips: 'Mention a kind of post you love; they\'ll tag you when they see one.'
  },
  {
    id: 'r011',
    text: 'Get a player to message you on a different platform than usual.',
    tips: 'Say your usual app keeps glitching and ask them to try another.'
  },
  {
    id: 'r012',
    text: 'Get a player to send you a screen recording of a game they\'re playing.',
    tips: 'Ask how far they\'ve got in a game and say you don\'t believe them.'
  },
  {
    id: 'r013',
    text: 'Get a player to send a screenshot of their home screen.',
    tips: 'Ask how they organise their apps, or what wallpaper they\'ve got.'
  },
  {
    id: 'r014',
    text: 'Get a player to change their profile picture.',
    tips: 'Tell them their current one is so old it needs retiring.'
  },
  {
    id: 'r015',
    text: 'Get a player to send a photo of food they\'re eating.',
    tips: 'Ask what they\'re having for dinner: "Pics or it didn\'t happen."'
  },
  {
    id: 'r016',
    text: 'Get a player to send you a photo of themselves as a kid.',
    tips: 'Send one of yourself as a kid and say "Your turn."'
  },
  {
    id: 'r017',
    text: 'Get a player to suggest a public place for your next meet-up.',
    tips: 'Talk about finally meeting up and ask where you should go.'
  },
  {
    id: 'r018',
    text: 'Get a player to start a new group chat.',
    tips: 'Pitch a plan that needs its own chat: a trip, a gift, a party.'
  },
  {
    id: 'r019',
    text: 'Get a player to reply to one of your stories.',
    tips: 'Post a story that asks a question or begs a reaction.'
  },
  {
    id: 'r020',
    text: 'Get a player to comment on one of your social posts.',
    tips: 'Post something that invites opinions, like two outfit choices.'
  },
  {
    id: 'r021',
    text: 'Get a player to send a photo or video with an animal in it.',
    tips: 'Ask how their pet (or a neighbour\'s cat) is doing.'
  },
  {
    id: 'r022',
    text: 'Get a player to use a silly filter and send it.',
    tips: 'Send yourself in a ridiculous filter and dare them to beat it.'
  },
  {
    id: 'r023',
    text: 'Get a player to message you while walking somewhere.',
    tips: 'Catch them on their commute and ask where they\'re off to.'
  },
  {
    id: 'r024',
    text: 'Get a player to send a mirror selfie.',
    tips: 'Ask for an outfit check before they go out.'
  },
  {
    id: 'r025',
    text: 'Get a player to send a sticker as a reply.',
    tips: 'Send them a sticker first. It\'s contagious.'
  },
  {
    id: 'r026',
    text: 'Get a player to double message you.',
    tips: 'Ask something juicy, then go quiet for a bit.'
  },
  {
    id: 'r027',
    text: 'Get a player to send a blurry photo.',
    tips: 'Ask for a quick pic of something that won\'t sit still, like a pet.'
  },
  {
    id: 'r028',
    text: 'Get a player to send you a calendar invite.',
    tips: 'Agree on plans and say "Send me an invite or I\'ll forget."'
  },
  {
    id: 'r029',
    text: 'Get a player to send you a message and then delete it.',
    tips: 'Keep a rapid-fire chat going; fast typing leads to deleted typos.'
  },
  {
    id: 'r030',
    text: 'Get a player to send you a screen recording showing how to do something in an app.',
    tips: 'Ask how to do something on your phone that they\'re better at.'
  },
  {
    id: 'r031',
    text: 'Get a player to forward you a post from X (Twitter).',
    tips: 'Ask what everyone\'s arguing about online today.'
  },
  {
    id: 'r032',
    text: 'Get a player to send you a voice note from outdoors.',
    tips: 'Message them when they\'re out and say typing is too slow.'
  },
  {
    id: 'r033',
    text: 'Get a player to like one of your social media posts.',
    tips: 'Mention a new post you\'re proud of.'
  },
  {
    id: 'r034',
    text: 'Get a player to flip their camera around on a video call.',
    tips: 'Ask to see their pet, their dinner or their new trainers.'
  },
  {
    id: 'r035',
    text: 'Get a player to send you an emoji you\'ve never seen before.',
    tips: 'Claim you\'ve already seen every emoji there is.'
  },
  {
    id: 'r036',
    text: 'Get a player to share a Spotify or YouTube playlist with you.',
    tips: 'Say you need music for a long journey or a workout.'
  },
  {
    id: 'r037',
    text: 'Get a player to reply with a screenshot of one of your messages.',
    tips: 'Say something quotable they\'ll want to keep as evidence.'
  },
  {
    id: 'r038',
    text: 'Get a player to post something on their story after you mention it.',
    tips: 'Hype up a song, place or snack until they share it.'
  },
  {
    id: 'r039',
    text: 'Get a player to send you something they\'re currently watching.',
    tips: 'Ask what they\'re watching and say you need a new show.'
  },
  {
    id: 'r040',
    text: 'Get a player to switch from texting to voice notes.',
    tips: 'Ask a question that needs a long answer.'
  },
  {
    id: 'r041',
    text: 'Get a player to ask you what they should have for dinner.',
    tips: 'Talk about a great meal you just had to get them thinking about food.'
  },
  {
    id: 'r042',
    text: 'Get a player to send you a countdown to an upcoming event.',
    tips: 'Ask how many days until their holiday or birthday.'
  },
  {
    id: 'r043',
    text: 'Get a player to create a poll in the group chat.',
    tips: 'Start a debate the group can\'t settle; someone will call a vote.'
  },
  {
    id: 'r044',
    text: 'Get a player to answer a poll or question sticker on your story.',
    tips: 'Post a this-or-that poll they\'ll have strong views on.'
  },
  {
    id: 'r045',
    text: 'Get a player to describe their favourite phone widget.',
    tips: 'Show off a widget you just added and ask which ones they use.'
  },
  {
    id: 'r046',
    text: 'Get a player to share a joke they wrote themselves.',
    tips: 'Send a terrible homemade joke and challenge them to write a worse one.'
  },
  {
    id: 'r047',
    text: 'Get a player to send you a funny typo or autocorrect.',
    tips: 'Send them a classic autocorrect fail and ask if they have one.'
  },
  {
    id: 'r048',
    text: 'Get a player to message you during a workout.',
    tips: 'Message them around their usual gym time.'
  },
  {
    id: 'r049',
    text: 'Get a player to reply using only emojis.',
    tips: 'Reply to them with only emojis first.'
  },
  {
    id: 'r050',
    text: 'Get a player to send you a photo of their workspace.',
    tips: 'Send yours and ask if theirs is any tidier.'
  },
  {
    id: 'r051',
    text: 'Get a player to show you a post before they publish it.',
    tips: 'Offer to help pick the best photo or caption.'
  },
  {
    id: 'r052',
    text: 'Get a player to message you after midnight.',
    tips: 'Start a fun chat late in the evening and keep it going.'
  },
  {
    id: 'r053',
    text: 'Get a player to send you a picture and ask your opinion on it.',
    tips: 'Mention you\'re great at picking outfits, gifts or paint colours.'
  },
  {
    id: 'r054',
    text: 'Get a player to send you a voice note shorter than five seconds.',
    tips: 'Ask a quick yes-or-no question by voice note.'
  },
  {
    id: 'r055',
    text: 'Get a player to send you a short video of what they\'re doing right now.',
    tips: 'When they tell you what they\'re up to, reply "Prove it."'
  },
  {
    id: 'r056',
    text: 'Get a player to reply to your message within one minute.',
    tips: 'Send something they\'ll want to answer straight away, like big news.'
  },
  {
    id: 'r057',
    text: 'Get a player to send a snap instead of a message.',
    tips: 'Send them a snap first and keep the chat going there.'
  },
  {
    id: 'r058',
    text: 'Get a player to suggest a new name for the group chat.',
    tips: 'Complain that the group name is boring.'
  },
  {
    id: 'r059',
    text: 'Get a player to reply to one of your messages with a GIF.',
    tips: 'Send a GIF first and keep the reactions going.'
  },
  {
    id: 'r060',
    text: 'Get a player to send you a photo of their handwriting.',
    tips: 'Claim your handwriting is the worst and dare them to prove theirs is worse.'
  },
  {
    id: 'r061',
    text: 'Get a player to share something they\'re reading.',
    tips: 'Ask for a book or article recommendation.'
  },
  {
    id: 'r062',
    text: 'Get a player to send you a "good morning" message.',
    tips: 'Send them one first, a few mornings in a row.'
  },
  {
    id: 'r063',
    text: 'Get a player to draw something and send a photo of it.',
    tips: 'Describe something ridiculous and say you can\'t picture it.'
  },
  {
    id: 'r064',
    text: 'Get a player to reply with a Boomerang or Live Photo.',
    tips: 'Send one yourself and ask what they\'re doing.'
  },
  {
    id: 'r065',
    text: 'Get a player to send a picture of their socks or shoes.',
    tips: 'Ask their opinion on your new trainers, then ask what they\'re wearing.'
  },
  {
    id: 'r066',
    text: 'Get a player to recommend a YouTube channel.',
    tips: 'Say you\'ve run out of things to watch on your lunch break.'
  },
  {
    id: 'r067',
    text: 'Get a player to send a message using voice-to-text.',
    tips: 'Message them while their hands are busy cooking or carrying shopping.'
  },
  {
    id: 'r068',
    text: 'Get a player to screenshot a frame from a video and send it.',
    tips: 'Ask for the funniest moment in a show they\'re watching.'
  },
  {
    id: 'r069',
    text: 'Get a player to message you while in bed.',
    tips: 'Send something late enough that they\'re already tucked in.'
  },
  {
    id: 'r070',
    text: 'Get a player to tell you what the weather is like where they are.',
    tips: 'Complain about your weather and ask "What\'s it like there?"'
  },
  {
    id: 'r071',
    text: 'Get a player to send a picture that sums up their mood.',
    tips: 'Send your own "current mood" pic and ask for theirs.'
  },
  {
    id: 'r072',
    text: 'Get a player to message you while on public transport.',
    tips: 'Message them around their commute time.'
  },
  {
    id: 'r073',
    text: 'Get a player to take and send a photo with flash.',
    tips: 'Ask for a pic of something in a dark spot, like a cupboard or the garden at night.'
  },
  {
    id: 'r074',
    text: 'Get a player to reply while at work.',
    tips: 'Send something funny mid-morning on a weekday.'
  },
  {
    id: 'r075',
    text: 'Get a player to send a photo with sunglasses on.',
    tips: 'Ask which sunglasses suit them best: "Show me."'
  },
  {
    id: 'r077',
    text: 'Get a player to tell you what\'s on their to-do list today.',
    tips: 'Moan about your own to-do list and ask about theirs.'
  },
  {
    id: 'r079',
    text: 'Get a player to post and delete something (you must see both).',
    tips: 'Hype them into posting a bold opinion; second thoughts often follow.'
  },
  {
    id: 'r080',
    text: 'Get a player to send a selfie video.',
    tips: 'Ask them to show off their new haircut or outfit "properly".'
  },
  {
    id: 'r081',
    text: 'Get a player to switch devices mid-conversation (e.g. phone to laptop).',
    tips: 'Send a link that\'s much better on a big screen.'
  },
  {
    id: 'r082',
    text: 'Get a player to send you something while you\'re on a call together.',
    tips: 'Mention a photo or link during the call and ask them to send it.'
  },
  {
    id: 'r083',
    text: 'Get a player to search for and send you a picture of something oddly specific.',
    tips: 'Describe something bizarre, like "a cat in a tiny hat", and say it can\'t exist.'
  },
  {
    id: 'r084',
    text: 'Get a player to send you a photo of something they cooked or baked.',
    tips: 'Ask for a recipe they swear by, then ask how it turned out.'
  },
  {
    id: 'r085',
    text: 'Get a player to send you a screenshot of a funny comment they found online.',
    tips: 'Ask what the best comment they\'ve seen this week was.'
  },
  {
    id: 'r086',
    text: 'Get a player to reply to you while watching Netflix or YouTube.',
    tips: 'Message them in the evening and ask what they\'re watching.'
  },
  {
    id: 'r088',
    text: 'Get a player to send you a photo from this time last year.',
    tips: 'Say "Can you believe a year ago we were..." and ask what they were up to.'
  },
  {
    id: 'r089',
    text: 'Get a player to message you while listening to music.',
    tips: 'Ask what they\'re listening to right now.'
  },
  {
    id: 'r090',
    text: 'Get a player to send you a photo of the night sky or the moon.',
    tips: 'Tell them the moon looks amazing tonight and ask if they can see it.'
  },
  {
    id: 'r091',
    text: 'Get a player to send you a screenshot of their battery level.',
    tips: 'Complain your phone is on 2% and bet theirs is worse.'
  },
  {
    id: 'r092',
    text: 'Get a player to reply during a live event (sports, concert, etc.).',
    tips: 'Message them when you know a big match or gig is on.'
  },
  {
    id: 'r093',
    text: 'Get a player to switch the chat theme or background.',
    tips: 'Complain your chat looks boring and dare them to fix it.'
  },
  {
    id: 'r094',
    text: 'Get a player to forward you an update from a public channel or news account.',
    tips: 'Ask where they get their news or sports updates.'
  },
  {
    id: 'r095',
    text: 'Get a player to sing in a voice note.',
    tips: 'Send a voice note of yourself singing badly and ask them to finish the line.'
  },
  {
    id: 'r096',
    text: 'Get a player to send a "just woke up" photo.',
    tips: 'Message them first thing and say "Prove you\'re awake."'
  },
  {
    id: 'r097',
    text: 'Get a player to recommend you a podcast.',
    tips: 'Say you need something to listen to on a long walk.'
  },
  {
    id: 'r098',
    text: 'Get a player to send a video with their own commentary.',
    tips: 'Ask them to film their pet, dinner or view "with narration".'
  },
  {
    id: 'r099',
    text: 'Get a player to send a photo of the most random object within reach.',
    tips: 'Turn it into a game and send yours first.'
  },
  {
    id: 'r100',
    text: 'Get a player to send you an old photo or video of the two of you.',
    tips: 'Reminisce about a trip or night out you had together.'
  },
  {
    id: 'r101',
    text: 'Get a player to voice note you before 10 am.',
    tips: 'Send a morning voice note of your own early in the day.'
  },
  {
    id: 'r102',
    text: 'Get a player to send you a "good night" message.',
    tips: 'Keep a chat going until late, then say you\'re heading to bed.'
  },
  {
    id: 'r103',
    text: 'Get a player to ask you a question on two days in a row.',
    tips: 'End each chat on a cliffhanger they\'ll want to ask about.'
  },
  {
    id: 'r104',
    text: 'Get a player to call you two days in a row.',
    tips: 'Have news that\'s easier to explain on the phone, with a part two.'
  },
  {
    id: 'r105',
    text: 'Get a player to text you before 9 am on two separate days.',
    tips: 'Ask them to send you a wake-up message because you keep oversleeping.'
  },
  {
    id: 'r106',
    text: 'Get a player to send you a photo two days in a row.',
    tips: 'Start a daily photo challenge, like "Send me your lunch."'
  },
  {
    id: 'r107',
    text: 'Get a player to tag you in stories twice within 48 hours.',
    tips: 'Share an inside joke or a plan they\'ll want to post about.'
  },
  {
    id: 'r108',
    text: 'Get a player to reply to three of your stories.',
    tips: 'Post a story series that asks for opinions.'
  },
  {
    id: 'r109',
    text: 'Get a player to reply within 60 seconds of your message, three times in a row.',
    tips: 'Start a fast back-and-forth game like 20 Questions.'
  },
  {
    id: 'r110',
    text: 'Get a player to send you a voice note in a fake accent.',
    tips: 'Send one of your own in a terrible accent and ask them to beat it.'
  },
  {
    id: 'r111',
    text: 'Get a player to send you a message in ALL CAPS.',
    tips: 'Share news that\'s impossible not to shout about.'
  },
  {
    id: 'r112',
    text: 'Get a player to rate something of yours out of 10.',
    tips: 'Send a photo of your outfit, cooking or new haircut and say "Be honest."'
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

// Get pack by ID (traditional packs only)
export function getPackById(packId: string): TaskPack | undefined {
  return gamePacks[packId];
}

// Get any pack by ID (includes Holiday Challenge Pack)
export function getAnyPackById(packId: string): TaskPack | HolidayChallengePack | undefined {
  if (packId === 'holiday-challenge') {
    return holidayChallengePack;
  }
  return gamePacks[packId];
}

// Get all available packs (traditional packs only)
export function getAllPacks(): TaskPack[] {
  return Object.values(gamePacks);
}

// Get all pack options for selection (includes Holiday Challenge Pack)
export function getAllPackOptions(): Array<TaskPack | HolidayChallengePack> {
  return [...Object.values(gamePacks), holidayChallengePack];
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

// ================================
// HOLIDAY CHALLENGE PACK
// ================================

// Holiday challenges with proof requirements
const holidayChallenges: Challenge[] = [
  { id: 'hc001', text: 'Get a stranger to guess where you\'re from', requiresProof: false },
  { id: 'hc002', text: 'Borrow sunscreen from another group', requiresProof: false },
  { id: 'hc003', text: 'Ask someone what time sunset is', requiresProof: false },
  { id: 'hc004', text: 'Get someone to take a group photo of your team', requiresProof: true },
  { id: 'hc005', text: 'With permission, clink glasses with someone not in your group', requiresProof: true },
  { id: 'hc006', text: 'Compliment a stranger\'s sunglasses or outfit', requiresProof: false },
  { id: 'hc007', text: 'Teach someone a word or phrase in a language they don\'t speak', requiresProof: false },
  { id: 'hc008', text: 'Ask someone how long they\'ve been on holiday', requiresProof: false },
  { id: 'hc009', text: 'Make a new friend and learn their name', requiresProof: false },
  { id: 'hc010', text: 'Ask someone to recommend their top 3 local foods', requiresProof: false },
  { id: 'hc011', text: 'With their permission, get a photo with someone wearing a Hawaiian or holiday shirt', requiresProof: true },
  { id: 'hc012', text: 'Ask to join another group\'s beach or pool game', requiresProof: true },
  { id: 'hc013', text: 'Get someone to take a creative mid-air photo of you on dry land', requiresProof: true },
  { id: 'hc014', text: 'Ask a stranger for the best thing to do around here', requiresProof: false },
  { id: 'hc015', text: 'Ask someone you\'ve met to recommend a local band, artist or account to follow', requiresProof: false },
  { id: 'hc016', text: 'Ask someone you just met to recommend their favourite local drink', requiresProof: false },
  { id: 'hc017', text: 'Ask someone what day it is (and act confused)', requiresProof: false },
  { id: 'hc018', text: 'Take a photo next to a tourist sign or map', requiresProof: true },
  { id: 'hc019', text: 'Dance to music in a public spot for 5 seconds', requiresProof: true },
  { id: 'hc020', text: 'Find someone with the same first name as you', requiresProof: false },
  { id: 'hc021', text: 'Get high fives from three people outside your group', requiresProof: false },
  { id: 'hc022', text: 'With their permission, take a photo with someone new while you both wear sunglasses', requiresProof: true },
  { id: 'hc023', text: 'Get another group to shout \'I love holidays!\' with you', requiresProof: false },
  { id: 'hc024', text: 'Ask a stranger what their favourite holiday destination is', requiresProof: false },
  { id: 'hc025', text: 'With their permission, take a photo with someone wearing a hat you like', requiresProof: true },
  { id: 'hc026', text: 'With their permission, get someone outside your group into your team photo', requiresProof: true },
  { id: 'hc027', text: 'Teach someone outside your group a dance move', requiresProof: false },
  { id: 'hc028', text: 'With their permission, record someone saying \'best holiday ever\'', requiresProof: true },
  { id: 'hc029', text: 'Ask someone to take a boomerang of your group', requiresProof: true },
  { id: 'hc030', text: 'Get someone to share their favourite birthday memory', requiresProof: false }
];

// Holiday Challenge Pack definition
export const holidayChallengePack: HolidayChallengePack = {
  id: 'holiday-challenge',
  name: 'YOU GOT WHO?',
  description: 'Everyone gets the same 10 random challenges! Race to complete them and earn points. Dynamic scoring based on group size!',
  challenges: holidayChallenges,
  winCondition: (playerCount: number) => {
    if (playerCount >= 9) return 12; // 9+ players: 12 points (4 golds or mix)
    if (playerCount >= 6) return 15; // 6-8 players: 15 points (5 golds or mix)
    return 18; // 2-5 players: 18 points (6 golds or mix)
  },
  goldPointValue: 3, // 3 points for first completion
  silverPointValue: 1, // 1 point for subsequent completions
  maxSilverPerChallenge: 2 // Max 2 silver awards per challenge
};

// ================================
// HOLIDAY CHALLENGE PACK HELPERS
// ================================

// Get the Holiday Challenge Pack
export function getHolidayChallengePack(): HolidayChallengePack {
  return holidayChallengePack;
}

// Get a specific challenge by ID
export function getChallengeById(challengeId: string): Challenge | undefined {
  return holidayChallenges.find(challenge => challenge.id === challengeId);
}

// Get all challenges from Holiday Challenge Pack
export function getAllHolidayChallenges(): Challenge[] {
  return holidayChallenges;
}

// Get random selection of challenges for YOU GOT WHO? game
export function getRandomHolidayChallenges(count: number = 10): Challenge[] {
  const shuffled = [...holidayChallenges].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, holidayChallenges.length));
}

// Check if a challenge requires proof
export function challengeRequiresProof(challengeId: string): boolean {
  const challenge = getChallengeById(challengeId);
  return challenge?.requiresProof || false;
}

// Get the win condition for holiday challenge pack based on player count
export function getHolidayChallengeWinCondition(playerCount: number): number {
  const { winCondition } = holidayChallengePack;
  return typeof winCondition === 'function' ? winCondition(playerCount) : winCondition;
}
