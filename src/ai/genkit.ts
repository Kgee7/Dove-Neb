import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// We use a getter or a fallback to prevent build-time crashes if keys are missing
const getApiKey = () => process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || '';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: getApiKey(),
    }),
  ],
  model: 'googleai/gemini-2.5-flash',
});
