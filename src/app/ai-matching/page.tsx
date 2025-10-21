import { Sparkles } from "lucide-react";
import AISuggestionForm from "./ai-suggestion-form";

export default function AIMatchingPage() {
  return (
    <div className="container max-w-3xl py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
          <Sparkles className="mr-2 h-4 w-4" />
          Powered by AI
        </div>
        <h1 className="mt-4 text-4xl font-bold tracking-tight font-headline">AI-Powered Job Matching</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Provide your skills and experience to get personalized job recommendations.
        </p>
      </div>

      <AISuggestionForm />
    </div>
  );
}
