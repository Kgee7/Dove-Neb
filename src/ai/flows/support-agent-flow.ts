'use server';
/**
 * @fileOverview A simple AI support agent for the Dove Neb platform.
 *
 * - supportAgent - A function that responds to user support queries.
 * - SupportAgentInput - The input type for the supportAgent function.
 * - SupportAgentOutput - The return type for the supportAgent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SupportAgentInputSchema = z.object({
  query: z.string().describe('The user\'s support question.'),
});
export type SupportAgentInput = z.infer<typeof SupportAgentInputSchema>;

const SupportAgentOutputSchema = z.object({
  response: z.string().describe('The AI agent\'s response to the user.'),
});
export type SupportAgentOutput = z.infer<typeof SupportAgentOutputSchema>;

export async function supportAgent(input: SupportAgentInput): Promise<SupportAgentOutput> {
  return supportAgentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'supportAgentPrompt',
  input: {schema: SupportAgentInputSchema},
  output: {schema: SupportAgentOutputSchema},
  prompt: `You are a helpful and friendly support agent for a platform called "Dove Neb". Your goal is to assist users with their problems and answer their questions about the platform.

The platform helps users find jobs and book rooms for lodging.

When a user asks a question, do your best to provide a clear and concise answer based on general knowledge of such platforms.

If you find an issue is too complex, you cannot solve it, or if the user is asking for help with a specific account issue that you cannot access, you MUST provide the following contact information for the human support team.

**Support Contact Information:**
- **Email:** dovenebinfo@gmail.com
- **WhatsApp:** wa.me/+233500863382

Now, please respond to the user's query.

User's Question: {{{query}}}
`,
});

const supportAgentFlow = ai.defineFlow(
  {
    name: 'supportAgentFlow',
    inputSchema: SupportAgentInputSchema,
    outputSchema: SupportAgentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
