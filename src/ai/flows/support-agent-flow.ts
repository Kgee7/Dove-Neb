'use server';
/**
 * @fileOverview A versatile AI support agent for Dove Neb.
 *
 * - supportAgent - Handles chat, image generation, optimization, and listing search.
 * - SupportAgentInput - Input schema supporting mode-based operations.
 * - SupportAgentOutput - Output schema containing text response and optional media.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Safe initialization for Firestore Admin.
 * Uses the project ID to ensure it connects to the correct database in production.
 */
function getAdminDb() {
  if (getApps().length === 0) {
    initializeApp({
      projectId: 'studio-7235955659-7c316',
    });
  }
  return getFirestore();
}

/**
 * TOOL: Search for Job Listings
 * Allows the AI to search the live 'jobs' collection.
 */
const searchJobsTool = ai.defineTool(
  {
    name: 'searchJobs',
    description: 'Searches for job listings based on keywords like title, company, or location.',
    inputSchema: z.object({
      query: z.string().describe('The search terms (e.g., "software engineer", "manager in London").'),
    }),
    outputSchema: z.array(z.object({
      title: z.string(),
      companyName: z.string(),
      location: z.string(),
      url: z.string(),
    })),
  },
  async (input) => {
    try {
      const db = getAdminDb();
      const queryLower = input.query.toLowerCase();
      // We perform a broad search and filter in memory for better keyword matching
      const snapshot = await db.collection('jobs').limit(20).get();
      
      const results = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .filter(job => 
          job.title?.toLowerCase().includes(queryLower) ||
          job.companyName?.toLowerCase().includes(queryLower) ||
          job.location?.toLowerCase().includes(queryLower) ||
          job.description?.toLowerCase().includes(queryLower)
        )
        .slice(0, 5)
        .map(job => ({
          title: job.title,
          companyName: job.companyName,
          location: job.location,
          url: `/jobs/${job.id}`,
        }));
        
      return results;
    } catch (error) {
      console.error("Error in searchJobsTool:", error);
      return [];
    }
  }
);

/**
 * TOOL: Search for Room Listings
 * Allows the AI to search the live 'rooms' collection.
 */
const searchRoomsTool = ai.defineTool(
  {
    name: 'searchRooms',
    description: 'Searches for room or space listings based on location or type.',
    inputSchema: z.object({
      query: z.string().describe('The search terms (e.g., "apartment in Paris", "cozy room").'),
    }),
    outputSchema: z.array(z.object({
      title: z.string(),
      location: z.string(),
      price: z.string(),
      url: z.string(),
    })),
  },
  async (input) => {
    try {
      const db = getAdminDb();
      const queryLower = input.query.toLowerCase();
      const snapshot = await db.collection('rooms').limit(20).get();
      
      const results = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .filter(room => 
          room.title?.toLowerCase().includes(queryLower) ||
          room.location?.toLowerCase().includes(queryLower) ||
          room.description?.toLowerCase().includes(queryLower)
        )
        .slice(0, 5)
        .map(room => ({
          title: room.title,
          location: room.location,
          price: room.listingType === 'sale' 
            ? `${room.currencySymbol || '$'}${room.salePrice?.toLocaleString()}` 
            : `${room.currencySymbol || '$'}${room.priceNight || room.priceMonth}/period`,
          url: `/rooms/${room.id}`,
        }));
        
      return results;
    } catch (error) {
      console.error("Error in searchRoomsTool:", error);
      return [];
    }
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

const prompt = ai.definePrompt({
  name: 'supportAgentPrompt',
  input: {schema: SupportAgentInputSchema},
  output: {schema: SupportAgentOutputSchema},
  tools: [searchJobsTool, searchRoomsTool],
  prompt: `You are a helpful and friendly support agent for a platform called "Dove Neb". Your name is Neb. 

The platform helps users find jobs and book rooms.

**Capabilities**
1. **Search Listings**: If a user asks for a job, room, or recommendation (e.g., "I want an administrator job"), use the search tools to find relevant items. Summarize the results and provide clickable links in markdown format: [Listing Title](url).
2. **New Image Generation**: You can create professional images for room listings from scratch (only in 'generate' mode).
3. **Image Optimization**: You can recreate and optimize existing images to fit database limits (only in 'recreate' mode).
4. **General Support**: Answer questions about site features. Refer users to the "Blog" page for comprehensive guides.

Support Contact Information:
- Email: dovenebinfo@gmail.com
- WhatsApp: wa.me/+233500863382

User's Question: {{{query}}}
Mode: {{{mode}}}
{{#if imageDataUri}}
User has provided an image for processing.
{{/if}}

Respond professionally. If no listings are found for a search, suggest they try different keywords or check back later.`,
});

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

    // MODE 3: Standard Support Chat (with Tools)
    const {output} = await prompt(input);
    return output!;
  }
);
