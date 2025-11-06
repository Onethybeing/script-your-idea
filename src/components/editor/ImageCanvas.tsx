import { Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface ImageCanvasProps {
  originalImage: string | null;
  generatedImage: string | null;
  isGenerating: boolean;
  progress: number;
}

export const ImageCanvas = ({
  originalImage,
  generatedImage,
  isGenerating,
  progress,
}: ImageCanvasProps) => {
  const handleDownload = () => {
    if (!generatedImage) return;
    
    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = `ai-generated-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Canvas</h2>
        {generatedImage && (
          <Button onClick={handleDownload} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center space-y-6 p-12">
            <Loader2 className="w-16 h-16 animate-spin text-primary" />
            <div className="w-64 space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-center text-sm text-muted-foreground">
                Generating your AI-powered image...
              </p>
            </div>
          </div>
        ) : generatedImage ? (
          <div className="relative max-w-full max-h-full">
            <img
              src={generatedImage}
              alt="Generated"
              className="max-w-full max-h-[calc(100vh-12rem)] rounded-lg shadow-2xl border-2 border-glass-border"
            />
          </div>
        ) : originalImage ? (
          <div className="relative max-w-full max-h-full">
            <img
              src={originalImage}
              alt="Original"
              className="max-w-full max-h-[calc(100vh-12rem)] rounded-lg opacity-50 border-2 border-dashed border-glass-border"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-lg text-muted-foreground bg-background/80 backdrop-blur-sm px-6 py-3 rounded-lg">
                Enter a prompt to transform this image
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center glass-panel p-12 rounded-lg max-w-md">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full ai-gradient flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Ready to Create</h3>
            <p className="text-muted-foreground">
              Upload an image or enter a prompt to start generating AI-powered artwork
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
