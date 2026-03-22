export type MemeCategory = 'motivational' | 'roast' | 'hinglish' | 'mixed';

const motivational: string[] = [
  "Rise and conquer! Your excuses won't fund your dreams 🔥",
  "Champions wake up. Everyone else hits snooze 🏆",
  "Your success is on the other side of this alarm ⚡",
  "Every second you sleep, someone is grinding harder 💪",
  "The early bird catches the worm. Now GET UP 🦅",
  "What you do in the morning defines your whole day 🌅",
  "Start strong. The world rewards the early risers 🌟",
  "You asked for this alarm. Now honor that commitment 🎯",
  "Discipline is choosing between what you want now and what you want most 🧠",
  "Your future self is watching. Don't let them down 🚀",
  "Success is built before breakfast. MOVE! ⏰",
];

const roast: string[] = [
  "Even your pillow is embarrassed for you 😭",
  "You're losing against yourself rn lmao 💀",
  "Your ex is already at the gym 🤡",
  "You snooze, you lose. And you ALWAYS snooze 😤",
  "Imagine sleeping when your competitor is grinding rn 💀",
  "Bro got defeated by a phone alarm 😭",
  "You're main character coded but sidekick behavior fr 💀",
  "This is why you're not where you wanna be 😔",
  "Another day, another excuse machine activating 🛌",
  "Not even a champion in waking up bro 🤦",
  "Your goals texted they gave up on you 💀",
];

const hinglish: string[] = [
  "Uth ja bhai, duniya jeetni hai 😤",
  "Snooze mat kar yaar, life thodi hai ⏳",
  "Tera competitor abhi gym mein hai 🔥",
  "Aaj bhi nahi utha to kuch nahi badlega 😔",
  "Neend tod de toh life ban jayegi bhai 🚀",
  "5 min aur mat bol — yahi bolta hai har din 🕐",
  "Kab uthegas? Log moon pe pohnch gaye hain 🌕",
  "Sapne dekh raha hai ya unhe achieve kar raha hai? Uth! 🧠",
  "Duniya aage badh rahi hai, tu bed mein hai 😒",
  "Tu alarm se bhi weak hai 💀",
  "Bilkul Snooze nahi — yahi teri pehli jeet hogi 🥇",
  "Alarm bajao, dimag kholo, kaam karo. UTH! 🧠",
];

const all = [...motivational, ...roast, ...hinglish];

const categoryMap: Record<MemeCategory, string[]> = {
  motivational,
  roast,
  hinglish,
  mixed: all,
};

export const getRandomMeme = (category: MemeCategory = 'mixed'): string => {
  const pool = categoryMap[category] ?? all;
  return pool[Math.floor(Math.random() * pool.length)];
};

export const MEME_CATEGORIES: { key: MemeCategory; label: string; description: string }[] = [
  { key: 'motivational', label: '🔥 Motivational', description: 'Pump you up' },
  { key: 'roast',        label: '💀 Roast Mode',   description: 'Brutal truth' },
  { key: 'hinglish',     label: '🇮🇳 Hinglish',    description: 'Desi vibes' },
  { key: 'mixed',        label: '🎲 Mixed',         description: 'Surprise me' },
];
