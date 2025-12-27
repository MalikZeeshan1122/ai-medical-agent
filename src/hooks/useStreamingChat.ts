import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
// Note: This hook should not import router components

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const useStreamingChat = (hospitalContext?: string, language: string = "en") => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (userMessage: string) => {
    const newUserMessage: Message = { role: "user", content: userMessage };
    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);

    let assistantContent = "";

    try {
      // Check if this is a hospital-related query
      const hospitalKeywords = ['hospital', 'laboratory', 'lab', 'department', 'service', 'victoria', 'bahawalpur', 'where is', 'location', 'find'];
      const isHospitalQuery = hospitalKeywords.some(keyword => 
        userMessage.toLowerCase().includes(keyword)
      );

      if (isHospitalQuery) {
        // Use hospital assistant for hospital-specific queries
        const { data, error: functionError } = await supabase.functions.invoke('hospital-assistant', {
          body: { 
            query: userMessage,
            hospitalName: hospitalContext || null
          }
        });

        if (functionError) throw functionError;

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response },
        ]);
      } else {
        // Use regular streaming chat for medical queries
        const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
        
        // Get user session and token
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        
        // Build system prompt with language instruction
        const languageNames: Record<string, string> = {
          en: "English",
          es: "Spanish",
          fr: "French",
          de: "German",
          zh: "Chinese",
          ar: "Arabic",
          hi: "Hindi",
          pt: "Portuguese",
          it: "Italian",
          ja: "Japanese"
        };
        
        let systemPrompt = "You are a knowledgeable medical assistant providing preliminary health guidance.";
        if (language && language !== "en") {
          const langName = languageNames[language] || language;
          systemPrompt += ` Always respond in ${langName}.`;
        }
        
        const messagesWithSystem = [
          { role: "system" as const, content: systemPrompt },
          ...messages,
          newUserMessage
        ];
        
        const response = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ 
            messages: messagesWithSystem,
            userId: session?.user?.id, // Pass user ID to enable API tools
            language: language // Pass language for additional context
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Network error' }));
          throw new Error(errorData.error || `Request failed with status ${response.status}`);
        }
        
        if (!response.body) {
          throw new Error("Failed to start streaming");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              
              if (content) {
                assistantContent += content;
                
                setMessages((prev) => {
                  const lastMessage = prev[prev.length - 1];
                  if (lastMessage?.role === "assistant") {
                    return prev.map((msg, idx) =>
                      idx === prev.length - 1
                        ? { ...msg, content: assistantContent }
                        : msg
                    );
                  }
                  return [...prev, { role: "assistant", content: assistantContent }];
                });
              }
            } catch (parseError) {
              buffer = line + "\n" + buffer;
              break;
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      
      // Show detailed error for debugging
      let errorMessage = "I apologize, but I'm having trouble connecting. Please try again in a moment.";
      
      if (error instanceof Response) {
        try {
          const errorData = await error.json();
          if (errorData.error) {
            errorMessage = `Error: ${errorData.error}`;
          }
        } catch {
          errorMessage = `HTTP Error ${error.status}: ${error.statusText}`;
        }
      } else if (error instanceof Error) {
        errorMessage = `Error: ${error.message}`;
        if (error.message.includes("503") || error.message.includes("504")) {
          errorMessage = "The AI service is temporarily unavailable. Please wait a moment and try again.";
        } else if (error.message.includes("429")) {
          errorMessage = "Too many requests. Please wait a moment before trying again.";
        }
      }
      
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: errorMessage,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return { messages, sendMessage, isLoading };
};

// Removed accidental Router setup; hooks should not render components