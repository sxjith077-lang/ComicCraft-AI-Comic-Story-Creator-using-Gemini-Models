export type Genre =
  | 'Superhero'
  | 'Sci-Fi'
  | 'Fantasy'
  | 'Adventure'
  | 'Mystery'
  | 'Comedy'
  | 'Horror'
  | 'Cyberpunk'
  | 'Slice of Life'
  | 'Noir Detective';

export type ArtStyle =
  | 'Classic Shonen Manga (B&W Screentone)'
  | 'Modern Color Manga'
  | 'Dark Seinen Manga'
  | 'Manga / Anime'
  | 'Classic Retro Comic'
  | 'Modern Graphic Novel'
  | 'Vibrant Pop Art'
  | 'Dark Noir & Ink'
  | 'Saturday Morning Cartoon'
  | 'Watercolor Fantasy'
  | 'Cyberpunk Neon';

export type ComicTone =
  | 'Action-Packed & Epic'
  | 'Witty & Humorous'
  | 'Dark & Gritty'
  | 'Mysterious & Suspenseful'
  | 'Lighthearted & Whimsical'
  | 'Dramatic & Emotional';

export type BubbleType = 'speech' | 'thought' | 'shout' | 'whisper';

export interface DialogueItem {
  id: string;
  character: string;
  text: string;
  bubbleType: BubbleType;
}

export interface CharacterProfile {
  name: string;
  description: string;
  costumeOrAppearance: string;
}

export interface ComicPanel {
  panelNumber: number;
  caption?: string;
  sceneDescription: string;
  dialogues: DialogueItem[];
  soundEffect?: string;
  japaneseSfx?: string;
  soundEffectPosition?: 'top-right' | 'center' | 'bottom-left' | 'top-left';
  imagePrompt: string;
  imageUrl?: string;
  visualMood?: string;
  cameraAngle?: string;
  kishotenketsuPhase?: string;
}

export interface ComicStory {
  id: string;
  title: string;
  subtitle?: string;
  genre: Genre;
  artStyle: ArtStyle;
  tone: ComicTone;
  issueNumber: number;
  date: string;
  characterProfiles: CharacterProfile[];
  synopsis: string;
  panels: ComicPanel[];
  author?: string;
  readingDirection?: 'ltr' | 'rtl';
  isMonochromeManga?: boolean;
}

export interface GenerateComicRequest {
  storyIdea: string;
  genre: Genre;
  panelCount: number;
  artStyle: ArtStyle;
  tone?: ComicTone;
  characterNames?: string;
}
