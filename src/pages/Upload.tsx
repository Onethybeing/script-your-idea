import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload as UploadIcon, Loader2 } from "lucide-react";

const Upload = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [promptTemplate, setPromptTemplate] = useState("");
  const [price, setPrice] = useState("0");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user || !title || !description || !category || !promptTemplate) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const { error } = await supabase.from("marketplace_products").insert({
        creator_id: session.user.id,
        title,
        description,
        category,
        prompt_template: promptTemplate,
        preview_image_url: previewImage,
        price: parseFloat(price),
        is_published: true,
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your content has been uploaded to the marketplace.",
      });

      navigate("/");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "An error occurred while uploading.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
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
    <div className="min-h-screen bg-background text-foreground">
      <div className="container max-w-3xl mx-auto py-8 px-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Editor
        </Button>

        <div className="glass-panel p-8 rounded-lg">
          <h1 className="text-3xl font-bold mb-2 ai-gradient-text">Upload to Marketplace</h1>
          <p className="text-muted-foreground mb-8">
            Share your AI prompts and styles with the community
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Epic Sunset Transformation"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Transform any image into a stunning sunset scene..."
                className="min-h-[100px]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lighting">Lighting</SelectItem>
                  <SelectItem value="style">Style</SelectItem>
                  <SelectItem value="background">Background</SelectItem>
                  <SelectItem value="effects">Effects</SelectItem>
                  <SelectItem value="color">Color</SelectItem>
                  <SelectItem value="portrait">Portrait</SelectItem>
                  <SelectItem value="landscape">Landscape</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prompt">Prompt Template *</Label>
              <Textarea
                id="prompt"
                value={promptTemplate}
                onChange={(e) => setPromptTemplate(e.target.value)}
                placeholder="Add dramatic sunset lighting with warm orange and pink tones..."
                className="min-h-[120px]"
                required
              />
              <p className="text-xs text-muted-foreground">
                This is the AI prompt that will be used when others select your style
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preview">Preview Image (Optional)</Label>
              <Input
                id="preview"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
              />
              {previewImage && (
                <img
                  src={previewImage}
                  alt="Preview"
                  className="mt-4 max-w-sm rounded-lg border border-glass-border"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (Credits)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Set to 0 to make it free for everyone
              </p>
            </div>

            <Button
              type="submit"
              disabled={isUploading}
              className="w-full ai-gradient"
              size="lg"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadIcon className="mr-2 h-5 w-5" />
                  Upload to Marketplace
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Upload;
