import {config} from 'dotenv';
config();

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

import {ai} from '@/ai/genkit';
import '@/ai/flows/job-recommender-flow';
import '@/ai/flows/description-writer-flow';
import '@/ai/flows/support-agent-flow';

const devConfig = {
  plugins: [googleAI()],
  logLevel: 'debug',
  // Override configured model for local testing if needed.
  // model: 'googleai/gemini-pro',
};

// Start the Genkit development server.
genkit(devConfig);

export default ai;
