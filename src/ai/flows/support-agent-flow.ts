
'use server';
/**
 * @fileOverview A simple AI support agent for the Dove Neb platform.
 *
 * - supportAgent - A function that responds to user support queries and handles image recreation.
 * - SupportAgentInput - The input type for the supportAgent function.
 * - SupportAgentOutput - The return type for the supportAgent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SupportAgentInputSchema = z.object({
  query: z.string().describe('The user\'s support question.'),
  imageDataUri: z.string().optional().describe('An optional image to process (e.g., for recreation/optimization).'),
});
export type SupportAgentInput = z.infer<typeof SupportAgentInputSchema>;

const SupportAgentOutputSchema = z.object({
  response: z.string().describe('The AI agent\'s response to the user.'),
  recreatedImage: z.string().optional().describe('The recreated or optimized image data URI, if requested.'),
});
export type SupportAgentOutput = z.infer<typeof SupportAgentOutputSchema>;

export async function supportAgent(input: SupportAgentInput): Promise<SupportAgentOutput> {
  return supportAgentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'supportAgentPrompt',
  input: {schema: SupportAgentInputSchema},
  output: {schema: SupportAgentOutputSchema},
  prompt: `You are a helpful and friendly support agent for a platform called "Dove Neb". Your name is Neb. Your goal is to assist users with their problems and answer their questions about the platform.

The platform helps users find jobs and book rooms for lodging.

**Special Feature: Image Optimization**
If a user provides an image and asks to "recreate" or "optimize" it for a room listing (usually because the original is too large), you must help them. You will explain that you are processing the image to fit the 1-2MB limit while maintaining high quality.

When a user asks a question, do your best to provide a clear and concise answer.

If you find an issue is too complex, you cannot solve it, or if the user is asking for help with a specific account issue that you cannot access, provide the human support contact info.

**Support Contact Information:**
- **Email:** dovenebinfo@gmail.com
- **WhatsApp:** wa.me/+233500863382

Now, please respond to the user's query.

User's Question: {{{query}}}
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
    // If an image is provided, we use the gemini-2.5-flash-image model to support image generation modality
    if (input.imageDataUri) {
      const result = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image',
        prompt: [
          { media: { url: input.imageDataUri } },
          { text: `User query: "${input.query}". 
          The user has provided an image. If they want to recreate or optimize it for a room listing, please do so. 
          The output image should be a high-quality recreation of the original but optimized for size.
          Provide a friendly text response along with the image.` }
        ],
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        }
      });

      return {
        response: result.text || "I've processed your image. You can find the optimized version below.",
        recreatedImage: result.media?.url
      };
    }

    const {output} = await prompt(input);
    return output!;
  }
);
