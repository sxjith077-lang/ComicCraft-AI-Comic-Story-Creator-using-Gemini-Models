import { ComicStory, GenerateComicRequest, ComicPanel, CharacterProfile } from '../types/comic';

export function generateFallbackComic(request: GenerateComicRequest): ComicStory {
  const {
    storyIdea,
    genre = 'Superhero',
    artStyle = 'Manga / Anime',
    tone = 'Action-Packed & Epic',
    panelCount = 4,
    characterNames = '',
  } = request;

  const count = Math.max(2, Math.min(8, Number(panelCount) || 4));
  const ideaWords = storyIdea.trim().split(/\s+/);
  const cleanTitleWord = ideaWords.slice(0, 4).join(' ').replace(/[^\w\s]/gi, '');
  const title = cleanTitleWord ? cleanTitleWord.toUpperCase() : 'CHRONICLES OF DESTINY';
  const subtitle = `A ${genre} Tale • ${tone}`;

  // Extract or default characters
  const customNames = characterNames
    ? characterNames.split(/[,&]/).map((n) => n.trim()).filter(Boolean)
    : [];

  const char1Name = customNames[0] || (artStyle.includes('Manga') || artStyle.includes('Anime') || artStyle.includes('Shonen') ? 'Ren' : 'Hero');
  const char2Name = customNames[1] || (artStyle.includes('Manga') || artStyle.includes('Anime') || artStyle.includes('Shonen') ? 'Kitsune' : 'Rival');

  const characterProfiles: CharacterProfile[] = [
    {
      name: char1Name,
      description: `Determined protagonist driven to confront the challenges of ${storyIdea.slice(0, 30)}...`,
      costumeOrAppearance: 'Spiky layered hair with ahoge cowlick, dark tactical tunic with glowing energy trim.',
    },
    {
      name: char2Name,
      description: 'Clever companion and rival with sharp tactical instincts.',
      costumeOrAppearance: 'Sleek silver hair, flowing mantle with mystical rune patterns, quick-draw blade.',
    },
  ];

  const isManga = artStyle.includes('Manga') || artStyle.includes('Shonen');

  const panels: ComicPanel[] = [];
  const kishotenketsu = ['起 (Hook)', '承 (Escalation)', '転 (Climax)', '結 (Resolution)'];
  const japaneseSfxList = ['ゴゴゴ…', 'ズバッ！', 'ドカーン！', 'キラーン！', 'バーン！', 'ドドド…'];
  const soundEffects = ['RUMBLE', 'SLASH!', 'BOOM!', 'SHING!', 'KRA-KOOM!', 'WHOOSH'];

  for (let i = 1; i <= count; i++) {
    const isFirst = i === 1;
    const isLast = i === count;
    const isClimax = i === Math.max(2, count - 1);

    let caption = '';
    let sceneDesc = '';
    let dialogues = [];
    const sfx = soundEffects[(i - 1) % soundEffects.length];
    const jSfx = japaneseSfxList[(i - 1) % japaneseSfxList.length];

    if (isFirst) {
      caption = `The journey begins: ${storyIdea.slice(0, 45)}...`;
      sceneDesc = `${char1Name} and ${char2Name} arrive at the scene, assessing the situation as dramatic winds howl around them.`;
      dialogues = [
        {
          id: `dlg-${i}-1`,
          character: char1Name,
          text: `Are you ready for this, ${char2Name}? There's no turning back now.`,
          bubbleType: 'speech' as const,
        },
        {
          id: `dlg-${i}-2`,
          character: char2Name,
          text: `I was ready before we even got here. Keep your guard up!`,
          bubbleType: 'speech' as const,
        },
      ];
    } else if (isClimax) {
      caption = 'The decisive confrontation reaches fever pitch!';
      sceneDesc = `Energy crackles violently as ${char1Name} channels their ultimate power while ${char2Name} coordinates the final strike.`;
      dialogues = [
        {
          id: `dlg-${i}-1`,
          character: char1Name,
          text: `This ends right here! Take everything I've got!`,
          bubbleType: 'shout' as const,
        },
        {
          id: `dlg-${i}-2`,
          character: char2Name,
          text: `Strike now while the path is open!`,
          bubbleType: 'shout' as const,
        },
      ];
    } else if (isLast) {
      caption = 'The dust settles across the battlefield.';
      sceneDesc = `${char1Name} and ${char2Name} catch their breath amid the smoking aftermath, victorious yet watchful.`;
      dialogues = [
        {
          id: `dlg-${i}-1`,
          character: char1Name,
          text: `We actually pulled it off...`,
          bubbleType: 'speech' as const,
        },
        {
          id: `dlg-${i}-2`,
          character: char2Name,
          text: `Don't relax just yet. The next challenge is already waiting.`,
          bubbleType: 'whisper' as const,
        },
      ];
    } else {
      caption = 'A sudden obstacle tests their teamwork.';
      sceneDesc = `${char1Name} parries an incoming attack as ${char2Name} leaps into position to counter.`;
      dialogues = [
        {
          id: `dlg-${i}-1`,
          character: char1Name,
          text: `Watch out on your left!`,
          bubbleType: 'shout' as const,
        },
        {
          id: `dlg-${i}-2`,
          character: char2Name,
          text: `Got it covered! Follow my lead!`,
          bubbleType: 'speech' as const,
        },
      ];
    }

    panels.push({
      panelNumber: i,
      caption,
      sceneDescription: sceneDesc,
      dialogues,
      soundEffect: sfx,
      japaneseSfx: jSfx,
      soundEffectPosition: i % 2 === 0 ? 'top-right' : 'center',
      imagePrompt: `${artStyle} style comic panel, ${char1Name} and ${char2Name} in ${sceneDesc}, cinematic lighting, dynamic perspective, vibrant colors.`,
      visualMood: isClimax ? 'Electric and explosive' : isFirst ? 'Tense and atmospheric' : 'Heroic and determined',
      cameraAngle: isClimax ? 'Dutch angle dynamic shot' : isFirst ? 'Wide establishing shot' : 'Low-angle heroic',
      kishotenketsuPhase: kishotenketsu[Math.min(i - 1, 3)],
    });
  }

  return {
    id: `comic-${Date.now()}`,
    title,
    subtitle,
    genre,
    artStyle,
    tone,
    issueNumber: Math.floor(Math.random() * 88) + 1,
    date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    characterProfiles,
    synopsis: storyIdea,
    panels,
    readingDirection: isManga ? 'rtl' : 'ltr',
    isMonochromeManga: artStyle.includes('B&W'),
    author: 'Created with ComicCraft Creative Engine',
  };
}
