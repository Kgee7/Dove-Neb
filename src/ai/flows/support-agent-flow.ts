'use server';
/**
 * @fileOverview A versatile AI support agent for Dove Neb.
 *
 * - supportAgent - Handles chat, text-to-image generation, and image-to-image optimization.
 * - SupportAgentInput - Input schema supporting mode-based operations.
 * - SupportAgentOutput - Output schema containing text response and optional media.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SupportAgentInputSchema = z.object({
  query: z.string().describe('The user\'s support question or image generation prompt.'),
  imageDataUri: z.string().optional().describe('An optional image to process (required for "recreate" mode).'),
  mode: z.enum(['chat', 'generate', 'recreate']).optional().default('chat').describe('The operation mode.'),
});
export type SupportAgentInput = z.infer<typeof SupportAgentInputSchema>;

const SupportAgentOutputSchema = z.object({
  response: z.string().describe('The AI agent\'s response to the user.'),
  recreatedImage: z.string().optional().describe('The generated or optimized image data URI.'),
});
export type SupportAgentOutput = z.infer<typeof SupportAgentOutputSchema>;

export async function supportAgent(input: SupportAgentInput): Promise<SupportAgentOutput> {
  return supportAgentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'supportAgentPrompt',
  input: {schema: SupportAgentInputSchema},
  output: {schema: SupportAgentOutputSchema},
  prompt: `You are a helpful and friendly support agent for a platform called "Dove Neb". Your name is Neb. 

The platform helps users find jobs and book rooms.

**Special Features**
1. **New Image Generation**: You can create professional images for room listings from scratch.
2. **Image Optimization**: You can recreate and optimize existing images to fit database limits.

Support Contact Information:
- Email: dovenebinfo@gmail.com
- WhatsApp: wa.me/+233500863382

Now, please respond to the user's query.

User's Question: {{{query}}}
Mode: {{{mode}}}
{{#if imageDataUri}}
User has provided an image for processing.
{{/if}}
`,
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

    // MODE 3: Standard Support Chat
    const {output} = await prompt(input);
    return output!;
  }
);
