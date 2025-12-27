// Test chat endpoint
const SUPABASE_URL = "https://cdklguvcodbzfemyyadv.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNka2xndXZjb2RiemZlbXl5YWR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMTEwNzYsImV4cCI6MjA4MDc4NzA3Nn0.IbUes38hMG5vfBwLiRdL60TC6UUQoNnypepuhNFFO5c";

async function testChat() {
  console.log("Testing chat endpoint...");
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ANON_KEY}`,
        "apikey": ANON_KEY,
      },
      body: JSON.stringify({
        messages: [
          { role: "user", content: "Hello, can you help me?" }
        ],
        userId: null
      }),
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response:", errorText);
      return;
    }

    const contentType = response.headers.get('content-type');
    console.log("Content-Type:", contentType);

    if (contentType?.includes('text/event-stream')) {
      console.log("\nStreaming response:");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        process.stdout.write(chunk);
      }
    } else {
      const text = await response.text();
      console.log("Response:", text);
    }
    
  } catch (error) {
    console.error("Test failed:", error.message);
  }
}

testChat();
