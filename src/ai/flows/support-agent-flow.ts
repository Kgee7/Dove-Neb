'use server';
/**
 * @fileOverview A versatile AI support agent for Dove Neb.
 *
 * - supportAgent - Handles chat, search, image generation, and image optimization.
 * - SupportAgentInput - Input schema supporting mode-based operations.
 * - SupportAgentOutput - Output schema containing text response and optional media.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getApps, initializeApp, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Helper to get or initialize the Firebase Admin App for server-side search.
 */
function getAdminApp(): App {
  if (getApps().length === 0) {
    return initializeApp({
      projectId: 'studio-7235955659-7c316',
    });
  }
  return getApps()[0];
}

/**
 * Tool to search for active job listings.
 */
const searchJobsTool = ai.defineTool(
  {
    name: 'searchJobs',
    description: 'Searches for active job listings based on a query (title, company, or category).',
    inputSchema: z.object({ query: z.string().describe('Search terms for jobs.') }),
    outputSchema: z.array(z.object({
      id: z.string(),
      title: z.string(),
      companyName: z.string(),
      location: z.string(),
    })),
  },
  async ({ query }) => {
    const db = getFirestore(getAdminApp());
    const snapshot = await db.collection('jobs').where('status', '==', 'active').limit(50).get();
    const jobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    
    const lowerQuery = query.toLowerCase();
    return jobs.filter(j => 
      j.title?.toLowerCase().includes(lowerQuery) || 
      j.companyName?.toLowerCase().includes(lowerQuery) ||
      j.description?.toLowerCase().includes(lowerQuery)
    ).slice(0, 5).map(j => ({
      id: j.id,
      title: j.title,
      companyName: j.companyName,
      location: j.location,
    }));
  }
);

/**
 * Tool to search for active room listings.
 */
const searchRoomsTool = ai.defineTool(
  {
    name: 'searchRooms',
    description: 'Searches for room listings based on a query (title, location, or type).',
    inputSchema: z.object({ query: z.string().describe('Search terms for rooms.') }),
    outputSchema: z.array(z.object({
      id: z.string(),
      title: z.string(),
      location: z.string(),
      price: z.string(),
    })),
  },
  async ({ query }) => {
    const db = getFirestore(getAdminApp());
    const snapshot = await db.collection('rooms').where('status', '==', 'active').limit(50).get();
    const rooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    
    const lowerQuery = query.toLowerCase();
    return rooms.filter(r => 
      r.title?.toLowerCase().includes(lowerQuery) || 
      r.location?.toLowerCase().includes(lowerQuery) ||
      r.description?.toLowerCase().includes(lowerQuery)
    ).slice(0, 5).map(r => ({
      id: r.id,
      title: r.title,
      location: r.location,
      price: `${r.currencySymbol || ''}${r.priceNight || r.priceMonth || r.salePrice || ''}`,
    }));
  }
);

const SupportAgentInputSchema = z.object({
  query: z.string().describe('The user\'s support question, image generation prompt, or search request.'),
  imageDataUri: z.string().optional().describe('An optional image to process (required for "recreate" mode).'),
  mode: z.enum(['chat', 'generate', 'recreate']).optional().default('chat').describe('The operation mode.'),
});
export type SupportAgentInput = z.infer<typeof SupportAgentInputSchema>;

const SupportAgentOutputSchema = z.object({
  response: z.string().describe('The AI agent\'s response to the user.'),
  recreatedImage: z.string().optional().describe('The generated or optimized image data URI.'),
});
export type SupportAgentOutput = z.infer<typeof SupportAgentOutputSchema>;

/**
 * Entry point for the Support Agent AI.
 * Handles the logic-branching for different support modes.
 */
export async function supportAgent(input: SupportAgentInput): Promise<SupportAgentOutput> {
  return supportAgentFlow(input);
}

const supportAgentFlow = ai.defineFlow(
  {
    name: 'supportAgentFlow',
    inputSchema: SupportAgentInputSchema,
    outputSchema: SupportAgentOutputSchema,
  },
  async input => {
    // MODE 1: Create a completely new image from a text prompt
    if (input.mode === 'generate') {
      const result = await ai.generate({
        model: 'googleai/imagen-4.0-fast-generate-001',
        prompt: input.query || "A professional, high-quality photograph of a modern, cozy bedroom for a real estate listing.",
      });

      return {
        response: "I've generated a new image for you based on your description. You can see it below!",
        recreatedImage: result.media?.url
      };
    }

    // MODE 2: Recreate or optimize an existing image (Image-to-Image)
    if (input.mode === 'recreate' && input.imageDataUri) {
      const result = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image',
        prompt: [
          { media: { url: input.imageDataUri } },
          { text: `User request: "${input.query}". 
          Please recreate this image to be professional and optimized for a room listing. 
          Focus on making it look clean and bright while keeping the file size small.` }
        ],
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        }
      });

      return {
        response: result.text || "I've processed your image to be better suited for our platform. Here is the optimized version.",
        recreatedImage: result.media?.url
      };
    }

    // MODE 3: Standard Support Chat & Listing Search
    const result = await ai.generate({
      system: `You are a helpful and friendly support agent for a platform called "Dove Neb". Your name is Neb. 

      The platform helps users find jobs and book rooms.

      **Capabilities:**
      1. **Search Jobs**: If a user is looking for work (e.g., "I want administrator jobs"), use the 'searchJobs' tool.
      2. **Search Rooms**: If a user is looking for a place to stay or buy, use the 'searchRooms' tool.
      3. **Provide Links**: When listing search results, you MUST provide the title and a markdown link.
         - Format for Jobs: [Job Title](/jobs/[id])
         - Format for Rooms: [Room Title](/rooms/[id])
      4. **Image Services**: Mention that you can generate new listing photos or optimize existing ones.

      **Support Contact Information:**
      - Email: dovenebinfo@gmail.com
      - WhatsApp: wa.me/+233500863382`,
      prompt: input.query,
      tools: [searchJobsTool, searchRoomsTool],
    });

    return {
      response: result.text,
    };
  }
);
