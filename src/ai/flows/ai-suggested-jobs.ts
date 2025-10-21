'use server';
/**
 * @fileOverview An AI-powered job suggestion flow.
 *
 * - suggestJobs - A function that suggests jobs based on user profile and search history.
 * - SuggestJobsInput - The input type for the suggestJobs function.
 * - SuggestJobsOutput - The return type for the suggestJobs function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestJobsInputSchema = z.object({
  profile: z
    .string()
    .describe('The user profile including skills, experience, and preferences.'),
  searchHistory: z
    .string()
    .describe('The user search history on the job platform.'),
});
export type SuggestJobsInput = z.infer<typeof SuggestJobsInputSchema>;

const SuggestJobsOutputSchema = z.object({
  jobSuggestions: z
    .array(z.string())
    .describe('A list of suggested job titles based on the user profile and search history.'),
});
export type SuggestJobsOutput = z.infer<typeof SuggestJobsOutputSchema>;

export async function suggestJobs(input: SuggestJobsInput): Promise<SuggestJobsOutput> {
  return suggestJobsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestJobsPrompt',
  input: {schema: SuggestJobsInputSchema},
  output: {schema: SuggestJobsOutputSchema},
  prompt: `You are a job recommendation expert. Based on the user's profile and search history, suggest relevant job titles.

User Profile: {{{profile}}}
Search History: {{{searchHistory}}}

Suggest a list of job titles that match the user's profile and search history. Return only the titles of the jobs, each on a new line.

Job Suggestions:`,
});

const suggestJobsFlow = ai.defineFlow(
  {
    name: 'suggestJobsFlow',
    inputSchema: SuggestJobsInputSchema,
    outputSchema: SuggestJobsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return {
      jobSuggestions: output!.jobSuggestions,
    };
  }
);
