import 'dotenv/config';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const imageData = fs.readFileSync('./test-image.jpg').toString('base64');

const response = await ai.models.generateContent({
  model: 'gemini-3.5-flash-lite',
  contents: [
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageData,
      },
    },
    {
      text: `Describe this image for a person who is visually impaired.

Be clear, useful, and concise.

Mention important:
- people
- objects
- actions
- colors when useful
- surroundings
- potential obstacles or safety information

Do not make up information that cannot be seen.

Give a natural description in 2 to 4 sentences.`,
    },
  ],
});

console.log('\nAI DESCRIPTION:\n');
console.log(response.text);