import { useState, useRef, useEffect } from "react";
import { WelcomeScreen, type QuickStartType } from "@/components/WelcomeScreen";
import { SafetyDisclaimer } from "@/components/SafetyDisclaimer";
import { ChatMessage } from "@/components/ChatMessage";
import { InteractiveMessage } from "@/components/InteractiveMessage";
import { QuickActionBar } from "@/components/QuickActionBar";
import { ChatInput } from "@/components/ChatInput";
import { APIToolsIndicator } from "@/components/APIToolsIndicator";
import { useStreamingChat } from "@/hooks/useStreamingChat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

const Index = () => {
  const [showChat, setShowChat] = useState(false);
  const [language, setLanguage] = useState("en");
  const { messages, sendMessage, isLoading } = useStreamingChat(undefined, language);
  const scrollRef = useRef<HTMLDivElement>(null);
  const languageLabels: Record<string, string> = {
    en: "English",
    es: "Spanish",
    fr: "French",
    de: "German",
    zh: "Chinese",
    ar: "Arabic",
    hi: "Hindi",
    pt: "Portuguese",
    it: "Italian",
    ja: "Japanese",
  };
  const quickStartPrompts: Record<QuickStartType, string> = {
    "symptom-check":
      "I want to start a symptom check. Ask me structured questions to understand my current symptoms and any red flags.",
    "medication-reminder":
      "Help me set up a medication reminder. Collect medication name, dosage, timing, and any special instructions.",
    "health-screening":
      "Begin a preventive health screening. Walk me through age-appropriate screenings and risk factors to review."
  };

  const startChat = (initialMessage: string) => {
    setShowChat(true);
    sendMessage(initialMessage);
  };

  const applyLanguagePreference = (message: string) => {
    // Language is now handled by the hook with system prompt, so just return message as-is
    return message;
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleStart = () => {
    startChat(applyLanguagePreference("Hello, I'd like to discuss some health concerns I've been experiencing."));
  };

  const handleQuickStart = (type: QuickStartType) => {
    const prompt = quickStartPrompts[type] ?? quickStartPrompts["symptom-check"];
    startChat(applyLanguagePreference(prompt));
  };

  if (!showChat) {
    return (
      <WelcomeScreen
        onStart={handleStart}
        onQuickStart={handleQuickStart}
        language={language}
        onLanguageChange={setLanguage}
      />
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex-1 container mx-auto px-4 py-6 flex flex-col overflow-hidden">
        <SafetyDisclaimer />
        
        <div className="mb-3">
          <APIToolsIndicator />
        </div>

        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          <div className="space-y-4 pb-4">
            {messages.map((message, index) => {
              const isLastAssistantMessage =
                message.role === "assistant" && index === messages.length - 1;
              const shouldShowInteractive =
                isLastAssistantMessage && !isLoading;

              return shouldShowInteractive ? (
                <InteractiveMessage
                  key={index}
                  content={message.content}
                  onQuickResponse={sendMessage}
                  disabled={isLoading}
                />
              ) : (
                <ChatMessage
                  key={index}
                  role={message.role}
                  content={message.content}
                />
              );
            })}
            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">AI is analyzing your symptoms...</span>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="mt-4 space-y-3">
          {!isLoading && messages.length > 0 && (
            <QuickActionBar onSelectAction={sendMessage} disabled={isLoading} />
          )}
          <ChatInput onSend={sendMessage} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default Index;
