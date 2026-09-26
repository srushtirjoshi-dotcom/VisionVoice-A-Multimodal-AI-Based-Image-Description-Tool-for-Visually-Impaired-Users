import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function generateWithRetry(model, contents, maxRetries = 2) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await ai.models.generateContent({
        model,
        contents,
      });
    } catch (error) {
      lastError = error;

      const status = error?.status || error?.error?.code;

      // Retry only for temporary server/rate-limit errors
      if (![429, 500, 502, 503, 504].includes(Number(status))) {
        throw error;
      }

      // No delay after the final attempt
      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff: 2s, 4s, ...
      const delay = 2000 * Math.pow(2, attempt);

      console.log(
        `Gemini temporary error (${status}). Retrying in ${delay / 1000}s...`
      );

      await sleep(delay);
    }
  }

  throw lastError;
}
async function generateWithFallback(contents) {
  try {
    return await generateWithRetry(
      'gemini-3.5-flash-lite',
      contents,
      2
    );
  } catch (error) {
    console.warn(
      'Primary Gemini model failed. Trying fallback model...'
    );

    return await generateWithRetry(
      'gemini-3.5-flash',
      contents,
      1
    );
  }
}
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

    const response = await generateWithFallback([
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
    ]);

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