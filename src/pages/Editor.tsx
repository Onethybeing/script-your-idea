import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { ImageUpload } from "@/components/editor/ImageUpload";
import { PromptInput } from "@/components/editor/PromptInput";
import { ImageCanvas } from "@/components/editor/ImageCanvas";
import { Marketplace } from "@/components/editor/Marketplace";
import { Header } from "@/components/editor/Header";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const Editor = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [taskInfo, setTaskInfo] = useState<{ type: string; confidence: number } | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      } else {
        loadCredits(session.user.id);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      } else if (session.user) {
        loadCredits(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadCredits = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_credits")
      .select("free_credits, paid_credits")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error loading credits:", error);
      return;
    }

    if (!data) {
      // Create initial credits for new user
      await supabase.from("user_credits").insert({
        user_id: userId,
        free_credits: 50,
        paid_credits: 0,
      });
      setCredits(50);
    } else {
      setCredits((data.free_credits || 0) + (data.paid_credits || 0));
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || !user) {
      toast({
        title: "Missing information",
        description: "Please enter a prompt to generate an image.",
        variant: "destructive",
      });
      return;
    }

    if (credits <= 0) {
      toast({
        title: "No credits remaining",
        description: "Please upgrade your plan to continue generating images.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    try {
      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: {
          prompt,
          image_base64: uploadedImage,
          resolution: "1024x1024",
          quality: "balanced",
          media_type: mediaType,
        },
      });

      if (error) throw error;

      if (mediaType === "video") {
        setGeneratedVideo(data.video_url || data.image_url);
      } else {
        setGeneratedImage(data.image_url);
      }
      
      setTaskInfo({
        type: data.task_type || "generation",
        confidence: data.confidence || 0.95,
      });
      setProgress(100);

      // Deduct credit
      const { data: creditData } = await supabase
        .from("user_credits")
        .select("free_credits, paid_credits")
        .eq("user_id", user.id)
        .single();

      if (creditData) {
        if (creditData.free_credits > 0) {
          await supabase
            .from("user_credits")
            .update({ free_credits: creditData.free_credits - 1 })
            .eq("user_id", user.id);
        } else {
          await supabase
            .from("user_credits")
            .update({ paid_credits: creditData.paid_credits - 1 })
            .eq("user_id", user.id);
        }
        setCredits(credits - 1);
      }

      // Save to history
      await supabase.from("edit_history").insert({
        user_id: user.id,
        prompt,
        image_url: data.video_url || data.image_url,
        original_image_url: uploadedImage,
        task_type: data.task_type,
        confidence: data.confidence,
        generation_time_ms: data.generation_time_ms,
        model_used: data.model_used || "AI Model",
        resolution: "1024x1024",
      });

      toast({
        title: `${mediaType === "video" ? "Video" : "Image"} generated!`,
        description: `Your AI-powered ${mediaType} is ready.`,
      });
    } catch (error: any) {
      console.error("Generation error:", error);
      toast({
        title: "Generation failed",
        description: error.message || "An error occurred while generating the image.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!session) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background text-foreground overflow-hidden">
      <Header credits={credits} userEmail={user?.email || ""} />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Controls */}
        <div className="w-80 glass-panel border-r border-glass-border overflow-y-auto p-6 space-y-6">
          <ImageUpload onImageSelect={setUploadedImage} />
          
          <PromptInput
            prompt={prompt}
            onPromptChange={setPrompt}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            mediaType={mediaType}
            onMediaTypeChange={setMediaType}
          />

          {taskInfo && (
            <div className="glass-panel p-4 rounded-lg space-y-2">
              <p className="text-sm text-muted-foreground">Task Type</p>
              <p className="font-semibold capitalize">{taskInfo.type.replace("_", " ")}</p>
              <p className="text-sm text-muted-foreground">Confidence</p>
              <p className="font-semibold">{(taskInfo.confidence * 100).toFixed(0)}%</p>
            </div>
          )}
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 p-6 overflow-auto">
          <ImageCanvas
            originalImage={uploadedImage}
            generatedImage={generatedImage}
            generatedVideo={generatedVideo}
            isGenerating={isGenerating}
            progress={progress}
            mediaType={mediaType}
          />
        </div>

        {/* Right Sidebar - Marketplace */}
        <div className="w-80 glass-panel border-l border-glass-border overflow-y-auto p-6">
          <Marketplace />
        </div>
      </div>
    </div>
  );
};

export default Editor;
