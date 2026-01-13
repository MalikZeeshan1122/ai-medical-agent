import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { playMessageSent } from "@/lib/sounds";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export const ChatInput = ({ onSend, disabled }: ChatInputProps) => {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      playMessageSent();
      onSend(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Describe your symptoms or ask a question..."
        disabled={disabled}
        className="min-h-[60px] max-h-[120px] resize-none bg-card border-border focus:border-primary transition-colors"
      />
      <Button
        type="submit"
        disabled={disabled || !input.trim()}
        className="self-end bg-gradient-medical hover:opacity-90 shadow-medical transition-all"
      >
        <Send className="w-4 h-4" />
      </Button>
    </form>
  );
};
