import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2 } from "lucide-react";

interface PromptInputProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export const PromptInput = ({
  prompt,
  onPromptChange,
  onGenerate,
  isGenerating,
}: PromptInputProps) => {
  const suggestions = [
    "Add morning sunlight",
    "Remove background",
    "Make it cinematic",
    "Apply vintage style",
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        AI Prompt
      </h3>
      
      <Textarea
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        placeholder="Describe what you want to create or modify..."
        className="min-h-[120px] resize-none"
        disabled={isGenerating}
      />
      
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <Button
            key={suggestion}
            variant="outline"
            size="sm"
            onClick={() => onPromptChange(suggestion)}
            disabled={isGenerating}
            className="text-xs"
          >
            {suggestion}
          </Button>
        ))}
      </div>
      
      <Button
        onClick={onGenerate}
        disabled={!prompt.trim() || isGenerating}
        className="w-full ai-gradient animate-glow"
        size="lg"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-5 w-5" />
            Generate Image
          </>
        )}
      </Button>
    </div>
  );
};
