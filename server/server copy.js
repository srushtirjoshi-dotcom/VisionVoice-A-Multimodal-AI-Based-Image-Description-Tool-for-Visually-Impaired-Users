import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Test route
app.get('/', (req, res) => {
  res.json({
    message: 'VisionVoice backend is running!',
  });
});

// Gemini image description route
app.post('/describe', async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        error: 'No image was provided.',
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: image,
          },
        },
        {
          text: `Describe this image for a person who is visually impaired.

Be clear, useful, and concise.

Mention:
- important people
- important objects
- actions
- colors when useful
- surroundings
- potential obstacles or safety information when relevant

Do not make up information that cannot be seen.

Give one natural description in 2 to 4 sentences.`,
        },
      ],
    });

    res.json({
      description: response.text,
    });

  } catch (error) {
    console.error('Gemini error:', error);

    res.status(500).json({
      error: 'Could not generate an image description.',
    });
  }
});

const PORT = 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`VisionVoice backend running on port ${PORT}`);
});