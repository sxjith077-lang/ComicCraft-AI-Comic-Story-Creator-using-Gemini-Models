import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Server-side initialization of Gemini API
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper to check API key
const checkApiKey = (res: Response): boolean => {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'MY_GEMINI_API_KEY') {
    res.status(500).json({
      error: 'GEMINI_API_KEY is not configured on the server. Please ensure an API key is attached in Settings > Secrets.',
    });
    return false;
  }
  return true;
};

// Robust helper to strip markdown code blocks and parse JSON
function cleanAndParseJson(rawText: string): any {
  if (!rawText) throw new Error('Empty response received from AI model.');
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  }
  return JSON.parse(cleaned);
}

// Fallback executor across recommended models to guard against transient 503 / high demand spikes and quota limits
async function generateContentWithFallback(requestParams: {
  contents: any;
  config?: any;
}): Promise<any> {
  // Prioritize gemini-3.1-flash-lite for higher quota limits and fast response,
  // followed by gemini-flash-latest and gemini-3.8-flash
  const candidateModels = [
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-3.8-flash',
  ];

  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      console.log(`[ComicCraft] Generating with model: ${model}`);
      const response = await ai.models.generateContent({
        model,
        contents: requestParams.contents,
        config: requestParams.config,
      });

      if (response && response.text) {
        console.log(`[ComicCraft] Story generation succeeded with ${model}`);
        return response;
      }
    } catch (err: any) {
      // Model unavailable, rate limited, or high demand: silently try next model in candidate list
      console.log(`[ComicCraft] ${model} unavailable (${err?.status || 'retryable'}), attempting next candidate...`);
      lastError = err;
    }
  }

  throw lastError || new Error('Gemini models are currently experiencing high demand. Please retry in a few moments.');
}

// POST /api/generate-comic
app.post(['/api/generate-comic', '/api/generate-comic/'], async (req: Request, res: Response) => {
  try {
    if (!checkApiKey(res)) return;

    const {
      storyIdea,
      genre = 'Superhero',
      panelCount = 4,
      artStyle = 'Classic Retro Comic',
      tone = 'Action-Packed & Epic',
      characterNames = '',
    } = req.body;

    if (!storyIdea || typeof storyIdea !== 'string' || !storyIdea.trim()) {
      return res.status(400).json({ error: 'Please provide a story idea or concept.' });
    }

    const clampedPanels = Math.max(2, Math.min(8, Number(panelCount) || 4));

    const systemInstruction = `You are a legendary comic book writer and visual storyboard director.
Your job is to transform user prompts into complete, dynamic, professional comic stories divided into comic panels.
Structure your story perfectly across exactly ${clampedPanels} panels:
- Panel 1: Strong hook / establishing scene introducing characters & setting the stakes
- Middle panels: Escalating action, conflict, discoveries, twists, character interactions
- Final panel: Climax, resolution, cliffhanger, or punchline suited to the genre and tone

Cast & Character Requirements:
- Anime & Manga Character Design: Design characters with vibrant, iconic anime/manga traits: colorful layered hairstyles (spiky shonen locks with ahoge cowlick, anime twin-tails, sleek bishonen bangs), expressive eye colors, tactical anime tunics, billowing scarves/haori, mystical auras, or cyber visors.
- Give characters distinct anime personality archetypes (e.g. passionate determined protagonist, cool stoic rival, witty companion, eccentric mentor) with memorable names and signature abilities.
- Multi-Character Dialogue: Write punchy anime-style back-and-forth dialogue with emotional flair (spirited rival banter, dramatic tactical callouts, intense battle shouts, comedic reactions). Avoid boring single-character monologues! Let characters actively bounce off each other.
- Japanese Manga Pacing (Kishōtenketsu 起承転結):
  - Panel 1: 起 (Ki - Introduction & hook)
  - Middle: 承 (Shō - Escalation) and 転 (Ten - Dramatic Twist / Turning Point)
  - Final: 結 (Ketsu - Climax impact & resolution)
- Japanese Manga Sound Effects: Provide authentic Japanese onomatopoeia (e.g. 'ドドド…', 'ズバッ！', 'バーン！', 'ゴゴゴ…', 'キラーン！', 'ドカーン！') in japaneseSfx for each panel.

Requirements for each panel:
1. Panel number (1 to ${clampedPanels})
2. Scene description: Visually vivid description of characters' poses, expressions, environmental details, action, and lighting. Specify what each character is doing physically.
3. Character dialogues: Array of dialogues with character name, text (punchy comic style), and bubbleType: ('speech', 'thought', 'shout', 'whisper'). Multiple dialogue bubbles per panel showing back-and-forth character conversation.
4. Narration caption (optional or short): Yellow caption box text for narrator (e.g. "Meanwhile, high above the skyline...", "Three minutes before midnight...").
5. Sound effect (onomatopoeia, e.g. "KAPOW!", "SKRRRRT!", "BZZZZT!", "WHOOSH!", "SLAM!") and soundEffectPosition ('top-right', 'center', 'bottom-left', 'top-left').
6. Japanese sound effect (japaneseSfx in katakana, e.g. 'ドドド…', 'ズバッ！', 'バーン！', 'ゴゴゴ…').
7. Detailed image prompt: Formatted for AI image generation. Describe the visual layout in authentic ${artStyle} anime/manga art style, detailed cel shading, expressive anime eyes with specular highlights, layered anime hair, dynamic cinematic lighting, character physical descriptions (costumes, hair color, distinct features) to maintain visual consistency across all panels, camera angle (e.g. low-angle dynamic shot, close-up, Dutch angle), and color palette.
8. Visual mood and camera angle.
9. Kishotenketsu phase ('起 (Hook)', '承 (Escalation)', '転 (Climax)', '結 (Resolution)').

Character Consistency:
Maintain exact character names and consistent appearance details (clothing, hair, gadgets) in all panel descriptions and image prompts so the characters look identical across panels.`;

    const promptText = `Generate a complete ${clampedPanels}-panel comic book story.
Story Idea: "${storyIdea.trim()}"
Genre: ${genre}
Comic Art Style: ${artStyle}
Tone: ${tone}
${characterNames ? `Featured Characters: ${characterNames}` : ''}

Make it captivating, visually rich, and authentic to the comic medium.`;

    const response = await generateContentWithFallback({
      contents: promptText,
      config: {
        systemInstruction,
        temperature: 0.8,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Catchy, dramatic comic book title' },
            subtitle: { type: Type.STRING, description: 'Short issue title or tagline' },
            synopsis: { type: Type.STRING, description: '1-2 sentence overall synopsis of this comic episode' },
            characterProfiles: {
              type: Type.ARRAY,
              description: 'Key characters appearing in the comic with their consistent visual traits',
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING, description: 'Role and personality' },
                  costumeOrAppearance: { type: Type.STRING, description: 'Exact visual traits, costume, hair, colors for consistency' },
                },
                required: ['name', 'description', 'costumeOrAppearance'],
              },
            },
            panels: {
              type: Type.ARRAY,
              description: `Exactly ${clampedPanels} panels`,
              items: {
                type: Type.OBJECT,
                properties: {
                  panelNumber: { type: Type.INTEGER },
                  caption: { type: Type.STRING, description: 'Narrator caption text (optional, empty string if none)' },
                  sceneDescription: { type: Type.STRING, description: 'Detailed description of what is happening' },
                  dialogues: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        character: { type: Type.STRING },
                        text: { type: Type.STRING },
                        bubbleType: {
                          type: Type.STRING,
                          enum: ['speech', 'thought', 'shout', 'whisper'],
                        },
                      },
                      required: ['character', 'text', 'bubbleType'],
                    },
                  },
                  soundEffect: { type: Type.STRING, description: 'Comic sound effect like BAM, WHOOSH, CRASH, or empty string' },
                  japaneseSfx: { type: Type.STRING, description: 'Japanese Manga Onomatopoeia in Katakana (e.g. ドドド, ズバッ, バーン, ゴゴゴ, キラーン)' },
                  soundEffectPosition: {
                    type: Type.STRING,
                    enum: ['top-right', 'center', 'bottom-left', 'top-left'],
                  },
                  imagePrompt: { type: Type.STRING, description: 'Detailed prompt for generating artwork' },
                  visualMood: { type: Type.STRING, description: 'e.g. Electric neon, dark gothic, sunny meadow' },
                  cameraAngle: { type: Type.STRING, description: 'e.g. Low angle heroic, bird eye, extreme close-up' },
                  kishotenketsuPhase: { type: Type.STRING, description: 'Story phase: 起 (Hook), 承 (Escalation), 転 (Climax), or 結 (Resolution)' },
                },
                required: ['panelNumber', 'sceneDescription', 'dialogues', 'imagePrompt'],
              },
            },
          },
          required: ['title', 'synopsis', 'characterProfiles', 'panels'],
        },
      },
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error('Gemini API returned an empty response. Please try again.');
    }

    const parsedData = cleanAndParseJson(textOutput);

    // Format and enrich panel IDs
    const enrichedPanels = (parsedData.panels || []).map((panel: any, idx: number) => ({
      panelNumber: panel.panelNumber || idx + 1,
      caption: panel.caption || '',
      sceneDescription: panel.sceneDescription || '',
      dialogues: (panel.dialogues || []).map((d: any, dIdx: number) => ({
        id: `dlg-${idx + 1}-${dIdx + 1}`,
        character: d.character || 'Character',
        text: d.text || '',
        bubbleType: d.bubbleType || 'speech',
      })),
      soundEffect: panel.soundEffect || '',
      japaneseSfx: panel.japaneseSfx || '',
      soundEffectPosition: panel.soundEffectPosition || 'top-right',
      imagePrompt: panel.imagePrompt || '',
      visualMood: panel.visualMood || '',
      cameraAngle: panel.cameraAngle || 'Dynamic manga shot',
      kishotenketsuPhase: panel.kishotenketsuPhase || '',
    }));

    const isMangaStyle = artStyle.includes('Manga');
    const comicStory = {
      id: `comic-${Date.now()}`,
      title: parsedData.title || 'Untitled Comic',
      subtitle: parsedData.subtitle || `A ${genre} Story`,
      genre,
      artStyle,
      tone,
      issueNumber: Math.floor(Math.random() * 90) + 1,
      date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      characterProfiles: parsedData.characterProfiles || [],
      synopsis: parsedData.synopsis || '',
      panels: enrichedPanels,
      readingDirection: isMangaStyle ? 'rtl' : 'ltr',
      isMonochromeManga: artStyle.includes('B&W') || artStyle.includes('Seinen'),
      author: 'Created with ComicCraft & Gemini AI',
    };

    return res.json({ success: true, comic: comicStory });
  } catch (error: any) {
    console.error('Error generating comic story:', error);
    let errorMessage = error?.message || 'Failed to generate comic story.';
    if (errorMessage.includes('503') || errorMessage.includes('high demand')) {
      errorMessage = 'Gemini servers are currently experiencing high demand. Automatic retry is available.';
    }
    return res.status(500).json({
      error: `Gemini AI Error: ${errorMessage}`,
    });
  }
});

// POST /api/regenerate-panel
app.post(['/api/regenerate-panel', '/api/regenerate-panel/'], async (req: Request, res: Response) => {
  try {
    if (!checkApiKey(res)) return;

    const {
      comicTitle,
      genre,
      artStyle,
      tone,
      panelNumber,
      totalPanels,
      characterProfiles = [],
      previousPanelSummary,
      nextPanelSummary,
      currentPanel,
      customInstruction = '',
    } = req.body;

    const systemInstruction = `You are a comic book editor and writer modifying a single panel of an ongoing comic.
Ensure full continuity with the comic's characters, setting, art style (${artStyle}), and tone (${tone}).
${characterProfiles.length ? `Characters: ${JSON.stringify(characterProfiles)}` : ''}`;

    const promptText = `Regenerate Panel ${panelNumber} of ${totalPanels} for the comic "${comicTitle}".
Genre: ${genre}
Style: ${artStyle}
Tone: ${tone}
${previousPanelSummary ? `What happened just before (Panel ${panelNumber - 1}): ${previousPanelSummary}` : ''}
${nextPanelSummary ? `What happens next (Panel ${panelNumber + 1}): ${nextPanelSummary}` : ''}
${currentPanel?.sceneDescription ? `Original Panel Description: ${currentPanel.sceneDescription}` : ''}
${customInstruction ? `User specific modification: "${customInstruction}"` : 'Create a fresh, dynamic alternative version of this scene.'}`;

    const response = await generateContentWithFallback({
      contents: promptText,
      config: {
        systemInstruction,
        temperature: 0.85,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            panelNumber: { type: Type.INTEGER },
            caption: { type: Type.STRING },
            sceneDescription: { type: Type.STRING },
            dialogues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  character: { type: Type.STRING },
                  text: { type: Type.STRING },
                  bubbleType: {
                    type: Type.STRING,
                    enum: ['speech', 'thought', 'shout', 'whisper'],
                  },
                },
                required: ['character', 'text', 'bubbleType'],
              },
            },
            soundEffect: { type: Type.STRING },
            japaneseSfx: { type: Type.STRING },
            soundEffectPosition: {
              type: Type.STRING,
              enum: ['top-right', 'center', 'bottom-left', 'top-left'],
            },
            imagePrompt: { type: Type.STRING },
            visualMood: { type: Type.STRING },
            cameraAngle: { type: Type.STRING },
            kishotenketsuPhase: { type: Type.STRING },
          },
          required: ['panelNumber', 'sceneDescription', 'dialogues', 'imagePrompt'],
        },
      },
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error('Gemini API returned an empty response.');
    }

    const panelData = cleanAndParseJson(textOutput);
    const enrichedPanel = {
      panelNumber: Number(panelNumber) || 1,
      caption: panelData.caption || '',
      sceneDescription: panelData.sceneDescription || '',
      dialogues: (panelData.dialogues || []).map((d: any, dIdx: number) => ({
        id: `dlg-${panelNumber}-${dIdx + 1}-${Date.now()}`,
        character: d.character || 'Character',
        text: d.text || '',
        bubbleType: d.bubbleType || 'speech',
      })),
      soundEffect: panelData.soundEffect || '',
      japaneseSfx: panelData.japaneseSfx || '',
      soundEffectPosition: panelData.soundEffectPosition || 'top-right',
      imagePrompt: panelData.imagePrompt || '',
      visualMood: panelData.visualMood || '',
      cameraAngle: panelData.cameraAngle || 'Dynamic manga shot',
      kishotenketsuPhase: panelData.kishotenketsuPhase || '',
    };

    return res.json({ success: true, panel: enrichedPanel });
  } catch (error: any) {
    console.error('Error regenerating panel:', error);
    let errorMessage = error?.message || 'Failed to regenerate panel.';
    if (errorMessage.includes('503') || errorMessage.includes('high demand')) {
      errorMessage = 'Gemini servers are currently experiencing high demand. Please try again.';
    }
    return res.status(500).json({
      error: `Gemini AI Error: ${errorMessage}`,
    });
  }
});

// POST /api/generate-image
// Attempts to generate image via Gemini if image generation is supported/enabled
app.post(['/api/generate-image', '/api/generate-image/'], async (req: Request, res: Response) => {
  try {
    if (!checkApiKey(res)) return;

    const { prompt, artStyle = 'Comic Book' } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Image prompt is required.' });
    }

    const styledPrompt = `${prompt}, in high-detail ${artStyle} comic art style, bold inks, rich color palette, graphic novel panel illustration`;

    // Try generating image via gemini-3.1-flash-lite-image
    const imageResponse = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: [{ text: styledPrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: '1:1',
        },
      },
    });

    let imageUrl: string | null = null;
    const parts = imageResponse.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (imageUrl) {
      return res.json({ success: true, imageUrl });
    } else {
      return res.json({
        success: false,
        message: 'No image data returned from model.',
      });
    }
  } catch (error: any) {
    // Free-tier Gemini keys have limit: 0 for direct image models.
    // Return friendly JSON without spewing warnings into logs.
    return res.json({
      success: false,
      message: 'Direct Gemini image rendering requires a paid tier. Use the Copy Prompt button below for Midjourney/DALL-E, or upload artwork directly.',
    });
  }
});

// GET /api/health
app.get(['/api/health', '/api/health/'], (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
  });
});

// Explicit API 404 guard - guarantees no unmatched API route falls into HTML index handler
app.all('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found.',
  });
});

// Top-level API error handling middleware
app.use('/api', (err: any, _req: Request, res: Response, _next: any) => {
  console.error('[API Error]', err);
  res.status(500).json({
    success: false,
    error: err?.message || 'Internal server error.',
  });
});

// Vite middleware in dev or static serving in production
async function startServer() {
  const distPath = path.resolve(__dirname, 'dist');
  const hasDist = fs.existsSync(distPath) && fs.existsSync(path.resolve(distPath, 'index.html'));

  if (process.env.NODE_ENV === 'production' && hasDist) {
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ComicCraft server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
