// Test Gemini API directly
const API_KEY = "AIzaSyCV35N1wsBKNCVbVBe0EM3viNjzTo4pB-U";

async function testGemini() {
  console.log("Listing available Gemini models...");
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`, {
      method: "GET",
    });

    console.log("Response status:", response.status);
    
    const data = await response.json();
    console.log("Available models:", JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error("Test failed:", error.message);
  }
}

testGemini();

