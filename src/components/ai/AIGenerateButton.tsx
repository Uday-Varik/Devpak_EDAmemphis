import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AIGenerateButtonProps {
  prompt: string;
  context: Record<string, unknown>;
  section: string;
  currentValue: string;
  onInsert: (text: string) => void;
  label?: string;
  maxTokens?: number;
  size?: "sm" | "default";
}

export const AIGenerateButton = ({
  prompt,
  context,
  section,
  currentValue,
  onInsert,
  label = "Generate with AI",
  maxTokens,
  size = "sm",
}: AIGenerateButtonProps) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const existing = (currentValue || "").trim();
      const finalPrompt = existing
        ? `${prompt}\n\nThe developer has provided this draft:\n"""\n${existing}\n"""\nIncorporate their points and enhance the language into professional lender-ready prose while preserving their key ideas and intent. Do not discard their input.`
        : prompt;

      const { data, error } = await supabase.functions.invoke("ai-generate", {
        body: {
          prompt: finalPrompt,
          context: { ...context, existingDraft: existing || undefined },
          section,
          maxTokens,
        },
      });
      if (error) throw error;
      const text: string = (data as any)?.text || "";
      if (!text) throw new Error("empty");
      onInsert(text);
      toast.success(existing ? "Your draft was enhanced. Review and edit as needed." : "Text generated. Review and edit as needed.");
    } catch (err) {
      console.error(err);
      toast.error("AI generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      onClick={handleClick}
      disabled={loading}
      className="gap-1.5"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Sparkles className="w-3.5 h-3.5 text-accent" />
      )}
      {loading ? "Generating..." : (currentValue?.trim() ? "Enhance with AI" : label)}
    </Button>
  );
};
