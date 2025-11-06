import { Button } from "@/components/ui/button";
import { Sparkles, LogOut, Coins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface HeaderProps {
  credits: number;
  userEmail: string;
}

export const Header = ({ credits, userEmail }: HeaderProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/auth");
    }
  };

  return (
    <header className="glass-panel border-b border-glass-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="w-7 h-7 ai-gradient-text" />
          <h1 className="text-2xl font-bold ai-gradient-text">AI Image Studio</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 glass-panel px-4 py-2 rounded-lg">
            <Coins className="w-5 h-5 text-primary" />
            <span className="font-semibold">{credits}</span>
            <span className="text-sm text-muted-foreground">credits</span>
          </div>
          
          <div className="text-sm text-muted-foreground hidden md:block">
            {userEmail}
          </div>
          
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};
