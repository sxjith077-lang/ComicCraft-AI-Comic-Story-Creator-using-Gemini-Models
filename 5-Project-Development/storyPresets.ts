import { Genre, ArtStyle, ComicTone } from '../types/comic';

export interface StoryPreset {
  id: string;
  title: string;
  prompt: string;
  genre: Genre;
  artStyle: ArtStyle;
  tone: ComicTone;
  suggestedPanels: number;
  icon: string;
}

export const STORY_PRESETS: StoryPreset[] = [
  {
    id: 'shonen-demon-blade',
    title: 'Demon Blade: Black Flame Chronicles (鬼刃の黒炎)',
    prompt: 'A rogue ninja apprentice and a sacred kitsune spirit enter the forbidden martial arts tournament to stop an ancient shadow clan from unsealing the Dragon Core.',
    genre: 'Fantasy',
    artStyle: 'Classic Shonen Manga (B&W Screentone)',
    tone: 'Action-Packed & Epic',
    suggestedPanels: 4,
    icon: '⚔️',
  },
  {
    id: 'tokyo-sorcery-duo',
    title: 'Tokyo Exorcist: Crimson Moon (東京祓魔師)',
    prompt: 'A quiet high school student who secretly wields astral paper talismans teams up with a haughty silver-haired shrine maiden to banish curses across Shinjuku.',
    genre: 'Fantasy',
    artStyle: 'Modern Color Manga',
    tone: 'Action-Packed & Epic',
    suggestedPanels: 4,
    icon: '⛩️',
  },
  {
    id: 'superhero-heist',
    title: 'Solar Sentinel vs. Gravity Thief',
    prompt: 'A retired solar-powered superhero is called back for one final emergency when an anti-gravity thief floats the Metropolitan Museum into the stratosphere.',
    genre: 'Superhero',
    artStyle: 'Classic Retro Comic',
    tone: 'Action-Packed & Epic',
    suggestedPanels: 4,
    icon: '⚡',
  },
  {
    id: 'cyberpunk-neon',
    title: 'Neon Shadow: The Glitch Runner',
    prompt: 'In Neo-Kyoto 2099, a street hacker discovers that their robotic pet dog contains the encrypted backup consciousness of the city’s eccentric founder.',
    genre: 'Cyberpunk',
    artStyle: 'Cyberpunk Neon',
    tone: 'Mysterious & Suspenseful',
    suggestedPanels: 4,
    icon: '🤖',
  },
  {
    id: 'fantasy-grimoire',
    title: 'The Grumpy Spellbook',
    prompt: 'An apprentice wizard accidentally awakens an ancient enchanted spellbook that refuses to cast spells until it is served hot chamomile tea.',
    genre: 'Fantasy',
    artStyle: 'Saturday Morning Cartoon',
    tone: 'Witty & Humorous',
    suggestedPanels: 4,
    icon: '✨',
  },
  {
    id: 'noir-detective',
    title: 'The Vanishing Midnight Train',
    prompt: 'A hard-boiled private eye in rainy 1948 Chicago investigates the mysterious disappearance of an entire subway car between stops.',
    genre: 'Noir Detective',
    artStyle: 'Dark Noir & Ink',
    tone: 'Dark & Gritty',
    suggestedPanels: 4,
    icon: '🕵️‍♂️',
  },
  {
    id: 'comedy-pets',
    title: 'Secret Agent Paws',
    prompt: 'A tuxedo cat secretly leads a neighborhood spy ring to stop the neighbor’s automated lawnmower from taking over the garden.',
    genre: 'Comedy',
    artStyle: 'Vibrant Pop Art',
    tone: 'Lighthearted & Whimsical',
    suggestedPanels: 4,
    icon: '🐾',
  },
  {
    id: 'sci-fi-pizza',
    title: 'Cosmic Pizza Sprint',
    prompt: 'A rocket-skate courier has only 8 minutes to deliver a volcanic jalapeno pizza across three planetary rings before it goes cold.',
    genre: 'Sci-Fi',
    artStyle: 'Modern Graphic Novel',
    tone: 'Action-Packed & Epic',
    suggestedPanels: 6,
    icon: '🍕',
  },
];

export const RANDOM_PROMPTS = [
  "A librarian discovers an origami dragon in the library that comes alive whenever anyone sneezes.",
  "An astronaut stranded on Mars discovers that the red dust makes the galaxy's most delicious pancakes.",
  "A vampire dentist gets hired to clean Dracula's ancient gold fangs before the annual monster gala.",
  "Two rival supervillains realize they both accidentally scheduled their grand world takeover at the same rooftop coffee shop.",
  "A time traveler buys a lottery ticket in 1920, but the winning prize is 100 crates of sour pickles.",
  "A medieval knight enters a modern soapbox derby using an armored cart powered by enchanted fireflies.",
  "A detective discovers the culprit behind a city-wide blackout is a family of hyper-intelligent raccoons building a neon amusement park.",
  "A mermaid cafe barista must deal with a stubborn kraken who ordered a pumpkin spice latte with extra plankton.",
];
