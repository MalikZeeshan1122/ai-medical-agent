# AI Medical Assistant - API Documentation

Complete API reference for all Edge Functions and database operations.

## Table of Contents

1. [Authentication](#authentication)
2. [Edge Functions](#edge-functions)
3. [Database API](#database-api)
4. [Rate Limits](#rate-limits)
5. [Error Handling](#error-handling)
6. [Examples](#examples)

## Authentication

### Overview

The API uses JWT-based authentication via Supabase Auth.

### Authentication Headers

```http
Authorization: Bearer <jwt_token>
apikey: <supabase_anon_key>
```

### Get Authentication Token

```typescript
import { supabase } from '@/integrations/supabase/client';

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// Token is in: data.session.access_token
```

### Public vs Protected Endpoints

| Endpoint | Authentication | Notes |
|----------|---------------|-------|
| `/functions/v1/chat` | Optional | JWT not verified but recommended |
| `/functions/v1/scrape-hospital` | Optional | Public scraping service |
| `/functions/v1/advanced-scrape` | Optional | Public scraping service |
| `/functions/v1/private-ai-chat` | Required | User-specific conversations |
| `/functions/v1/hospital-assistant` | Optional | Context-aware hospital info |
| `/functions/v1/send-appointment-reminder` | Service Role | Internal use only |

## Edge Functions

### 1. Chat - AI Completions

Stream AI responses for medical queries.

**Endpoint**: `POST /functions/v1/chat`

**Request Body**:
```typescript
{
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  userId?: string; // Optional - enables API tool integrations
}
```

**Response**: Server-Sent Events (SSE) stream

**Features**:
- Real-time streaming responses
- **API Tool Integration** - When userId provided, AI can call configured external APIs
- Medical context-aware prompts
- Automatic error recovery
- Rate limiting protection

**API Tool Integration**:
When a `userId` is included, the chat function will:
1. Fetch user's active API integrations from database
2. Convert them to OpenAI-compatible tool definitions
3. Allow AI to intelligently call these APIs during conversation
4. Execute API requests securely with encrypted keys
5. Incorporate API responses into the conversation

**Example with API Tools**:
```typescript
const response = await fetch(CHAT_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  },
  body: JSON.stringify({
    messages: [{ 
      role: "user", 
      content: "What's the weather? Should I exercise outdoors?" 
    }],
    userId: currentUser.id // Enables API tool access
  })
});
// If user has Weather API configured, AI will:
// 1. Recognize weather info is needed
// 2. Call weather API automatically
// 3. Return response: "It's sunny and 22°C - perfect for outdoor exercise!"
```

**Response Format**:
```
data: {"choices":[{"delta":{"content":"Hello"}}]}
data: {"choices":[{"delta":{"content":" there"}}]}
data: [DONE]
```

**Example - Streaming Request**:
```typescript
const response = await fetch(
  'https://[project-id].supabase.co/functions/v1/chat',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // Optional
    },
    body: JSON.stringify({
      messages: [
        { role: 'user', content: 'What is diabetes?' }
      ]
    })
  }
);

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const text = decoder.decode(value);
  // Process SSE lines
  console.log(text);
}
```

**Error Responses**:
- `429` - Rate limit exceeded
- `402` - Payment required (out of AI credits)
- `500` - AI gateway error

---

### 2. Scrape Hospital

Scrape hospital website using Firecrawl or ScraperAPI.

**Endpoint**: `POST /functions/v1/scrape-hospital`

**Request Body**:
```typescript
{
  hospitalId: string;         // UUID of hospital record
  websiteUrl: string;          // Hospital website URL
  firecrawlApiKey?: string;   // Optional Firecrawl API key
  scraperApiKey?: string;      // Optional ScraperAPI key
}
```

**Response**:
```typescript
{
  success: boolean;
  pagesScraped: number;
  method: 'firecrawl' | 'scraperapi' | 'native';
  duration?: string;
}
```

**Example**:
```typescript
const { data, error } = await supabase.functions.invoke('scrape-hospital', {
  body: {
    hospitalId: 'uuid-here',
    websiteUrl: 'https://hospital.com',
    firecrawlApiKey: 'fc-xxxxx' // Optional
  }
});

if (error) {
  console.error('Scraping failed:', error);
} else {
  console.log(`Scraped ${data.pagesScraped} pages using ${data.method}`);
}
```

**Error Responses**:
```typescript
{
  error: string;          // Error message
  suggestion?: string;    // Helpful suggestion
}
```

Common errors:
- `Invalid URL` - Malformed website URL
- `Unauthorized: Invalid token` - API key is invalid
- `Website may be blocking requests` - Site has anti-scraping measures

---

### 3. Advanced Native Scrape

Advanced web scraping with deep crawling (no API key required).

**Endpoint**: `POST /functions/v1/advanced-scrape`

**Request Body**:
```typescript
{
  hospitalId: string;    // UUID of hospital record
  websiteUrl: string;    // Hospital website URL
}
```

**Response**:
```typescript
{
  success: boolean;
  pagesScraped: number;
  method: 'Advanced Native Scraper';
  duration: string;      // e.g., "45.32s"
}
```

**Features**:
- Recursive crawling (max 100 pages, depth 3)
- Intelligent content extraction
- Metadata extraction (emails, phones, JSON-LD)
- Page type classification
- Contact information detection

**Example**:
```typescript
const { data, error } = await supabase.functions.invoke('advanced-scrape', {
  body: {
    hospitalId: 'uuid-here',
    websiteUrl: 'https://hospital.com'
  }
});

console.log(`Scraped ${data.pagesScraped} pages in ${data.duration}`);
```

**Scraped Data Structure**:
```typescript
{
  url: string;
  title: string | null;
  content: string | null;    // Plain text content
  page_type: string | null;  // 'home' | 'services' | 'contact' | etc.
  metadata: {
    method: 'advanced_native';
    url: string;
    emails?: string[];       // Extracted email addresses
    phones?: string[];       // Extracted phone numbers
    structuredData?: any[];  // JSON-LD data
    [key: string]: any;      // Meta tags
  }
}
```

---

### 4. Private AI Chat

User-specific AI conversations with personal context.

**Endpoint**: `POST /functions/v1/private-ai-chat`

**Authentication**: Required

**Request Body**:
```typescript
{
  message: string;    // User's message
}
```

**Response**:
```typescript
{
  response: string;    // AI's response
  metadata?: {
    tokensUsed: number;
    model: string;
  }
}
```

**Example**:
```typescript
const { data, error } = await supabase.functions.invoke('private-ai-chat', {
  body: {
    message: 'What medications am I currently taking?'
  },
  headers: {
    Authorization: `Bearer ${token}`
  }
});

console.log('AI Response:', data.response);
```

**Context Included**:
- User profile information
- Current medications
- Chronic conditions
- Allergies
- Recent appointments

---

### 5. Hospital Assistant

Hospital-specific AI assistance using scraped data.

**Endpoint**: `POST /functions/v1/hospital-assistant`

**Request Body**:
```typescript
{
  hospitalId: string;   // UUID of hospital
  message: string;      // User's question
}
```

**Response**:
```typescript
{
  response: string;     // AI response with hospital context
  sources?: {          // Relevant pages used
    url: string;
    title: string;
    page_type: string;
  }[]
}
```

**Example**:
```typescript
const { data, error } = await supabase.functions.invoke('hospital-assistant', {
  body: {
    hospitalId: 'uuid-here',
    message: 'What are your emergency services hours?'
  }
});

console.log(data.response);
console.log('Sources:', data.sources);
```

---

### 6. Send Appointment Reminder

Send automated email reminder for appointments.

**Endpoint**: `POST /functions/v1/send-appointment-reminder`

**Authentication**: Service Role Only

**Request Body**:
```typescript
{
  appointmentId: string;    // UUID of appointment
  userId: string;           // UUID of user
  email: string;            // User's email
  appointmentDetails: {
    doctorName: string;
    appointmentDate: string;
    appointmentTime: string;
    location?: string;
    reason: string;
  }
}
```

**Response**:
```typescript
{
  success: boolean;
  messageId?: string;    // Email provider message ID
  error?: string;
}
```

**Note**: This function is typically triggered by scheduled tasks, not directly by clients.

---

## API Tool Integrations

### Overview

The AI Chat function supports dynamic API tool integrations, enabling the AI to call external APIs during conversations to provide real-time, accurate information beyond its training data.

### How It Works

1. **User Configuration**: Add API integrations in Settings → AI Providers → API Tool Integrations
2. **Automatic Registration**: Active APIs are automatically registered as tools when userId is provided in chat requests
3. **Intelligent Selection**: AI determines when to call APIs based on conversation context
4. **Secure Execution**: Backend executes API calls using encrypted keys
5. **Natural Integration**: AI seamlessly incorporates API data into responses

### Configuration

**Database Schema** (`ai_api_integrations`):
```typescript
{
  id: uuid;
  user_id: uuid;
  display_name: string;      // "Weather Service"
  api_name: string;           // "weather" (used for tool name)
  base_url: string;           // "https://api.weather.com"
  api_key_encrypted: string;  // Encrypted API key
  description: string;        // "Get weather forecasts and current conditions"
  is_active: boolean;         // Toggle tool availability
  config: jsonb;              // Additional settings
  created_at: timestamp;
  updated_at: timestamp;
}
```

**Tool Definition Format**:
Each API is automatically converted to OpenAI function calling format:
```json
{
  "type": "function",
  "function": {
    "name": "weather",
    "description": "Get weather forecasts and current conditions",
    "parameters": {
      "type": "object",
      "properties": {
        "endpoint": {
          "type": "string",
          "description": "API endpoint path (optional)"
        },
        "method": {
          "type": "string",
          "enum": ["GET", "POST", "PUT", "DELETE"],
          "description": "HTTP method"
        },
        "body": {
          "type": "object",
          "description": "Request body for POST/PUT"
        },
        "query_params": {
          "type": "object",
          "description": "URL query parameters"
        }
      },
      "required": ["method"]
    }
  }
}
```

### Supported Features

- **HTTP Methods**: GET, POST, PUT, DELETE
- **Query Parameters**: Dynamic URL parameter construction
- **Request Bodies**: JSON payloads for POST/PUT operations
- **Custom Endpoints**: Flexible paths within base URL
- **Authentication**: Automatic Bearer token header injection
- **Error Handling**: Graceful degradation on API failures

### Example Workflow

**1. User Adds Integration**:
```
Display Name: Weather API
API Name: weather
Base URL: https://api.openweathermap.org
API Key: abc123def456
Description: Get current weather and forecasts
Status: Active
```

**2. AI Conversation**:
```
User: "What's the weather in London? Should I go running?"

[AI recognizes need for weather data]
↓
[Calls weather API: GET /data/2.5/weather?q=London]
↓
[Receives: {"temp": 18, "conditions": "sunny"}]
↓
AI: "The weather in London is sunny and 18°C - perfect for a run! 
Stay hydrated and apply sunscreen."
```

**3. Tool Execution Flow**:
```typescript
// 1. Chat request with userId
POST /functions/v1/chat
{
  messages: [...],
  userId: "user-123"
}

// 2. Backend fetches active APIs
SELECT * FROM ai_api_integrations 
WHERE user_id = 'user-123' AND is_active = true;

// 3. AI decides to call weather API
tool_call: {
  name: "weather",
  arguments: {
    method: "GET",
    query_params: { q: "London" }
  }
}

// 4. Backend executes API call
GET https://api.openweathermap.org/data/2.5/weather?q=London
Authorization: Bearer abc123def456

// 5. Returns result to AI
tool_result: { temp: 18, conditions: "sunny" }

// 6. AI generates final response
"The weather in London is sunny and 18°C..."
```

### Security Considerations

✅ **API keys encrypted** in database  
✅ **Keys never exposed** to frontend  
✅ **Server-side execution** only  
✅ **User-specific RLS policies**  
✅ **Rate limiting** protection  
✅ **Error isolation** (API failures don't crash chat)

### Best Practices

1. **Clear Descriptions**: Help AI understand when to use each tool
   - ✅ Good: "Get current weather and 7-day forecasts for any location"
   - ❌ Bad: "Weather API"

2. **Specific API Names**: Use descriptive, unique identifiers
   - ✅ Good: `weather_forecast`, `stock_prices`, `crypto_rates`
   - ❌ Bad: `api1`, `service`, `tool`

3. **Minimal Permissions**: Use API keys with least privilege
   - Create read-only keys where possible
   - Limit rate quotas on API provider side
   - Monitor usage for anomalies

4. **Test Before Activating**: Verify endpoints work correctly
   - Check base URL is correct
   - Ensure API key has proper permissions
   - Test query parameters format

5. **Monitor Usage**: Track API calls in logs
   - Review which tools AI uses most
   - Identify unnecessary calls
   - Optimize API descriptions

### Example Integrations

**Weather Service**:
```
Display Name: Weather API
API Name: weather
Base URL: https://api.openweathermap.org/data/2.5
Description: Get current weather, forecasts, and air quality for any city
```

**Stock Market Data**:
```
Display Name: Stock Prices
API Name: stocks
Base URL: https://api.example.com
Description: Get real-time stock prices, historical data, and market trends
```

**Nutrition Database**:
```
Display Name: Nutrition Facts
API Name: nutrition
Base URL: https://api.nutritionix.com/v2
Description: Get nutritional information, calories, and macros for foods
```

**Fitness Tracking**:
```
Display Name: Fitness Data
API Name: fitness
Base URL: https://api.fitbit.com/1
Description: Get user's activity data, steps, heart rate, and sleep patterns
```

### Troubleshooting

**AI not calling tools**:
- Ensure `userId` is provided in chat request
- Check `is_active = true` in database
- Verify description clearly explains tool purpose
- Add more context in user message

**API call failures**:
- Verify base URL is correct (include protocol)
- Check API key has proper permissions
- Test endpoint manually first
- Review error logs for details

**Tools being called too often**:
- Refine tool description to be more specific
- Adjust system prompt to limit tool use
- Consider caching API responses

---

## Database API

### Direct Database Access

Use Supabase client for CRUD operations:

```typescript
import { supabase } from '@/integrations/supabase/client';

// Query with RLS
const { data, error } = await supabase
  .from('appointments')
  .select('*')
  .eq('user_id', userId);
```

### Real-time Subscriptions

```typescript
// Subscribe to changes
const channel = supabase
  .channel('appointments-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'appointments',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      console.log('Change received!', payload);
    }
  )
  .subscribe();

// Cleanup
channel.unsubscribe();
```

### Database Functions

#### get_hospital_scraping_stats

Get aggregated scraping statistics for a hospital.

```typescript
const { data, error } = await supabase
  .rpc('get_hospital_scraping_stats', {
    hospital_uuid: hospitalId
  });

// Returns:
// {
//   total_scrapes: number;
//   successful_scrapes: number;
//   failed_scrapes: number;
//   total_pages_scraped: number;
//   avg_duration_seconds: number;
//   last_scrape_date: string;
//   last_scrape_method: string;
// }
```

#### get_upcoming_appointments

Fetch upcoming appointments for a user.

```typescript
const { data, error } = await supabase
  .rpc('get_upcoming_appointments', {
    user_uuid: userId,
    days_ahead: 30  // Optional, defaults to 30
  });

// Returns array of upcoming appointments
```

## Rate Limits

### Lovable AI Gateway

- **Rate Limit**: Varies by workspace plan
- **Free Plan**: 5 requests/day (up to 30/month)
- **Paid Plans**: Higher limits, see Settings → Plans & Credits

### Error Codes

- `429 Too Many Requests`: Rate limit exceeded
  - Wait before retrying
  - Upgrade plan for higher limits
  
- `402 Payment Required`: Out of AI credits
  - Add credits in Settings → Workspace → Usage

### Best Practices

1. **Implement Backoff**:
```typescript
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, i) * 1000)
        );
      } else {
        throw error;
      }
    }
  }
}
```

2. **Cache Responses**:
```typescript
// Use React Query
const { data } = useQuery({
  queryKey: ['chat', messages],
  queryFn: () => sendChatMessage(messages),
  staleTime: 5 * 60 * 1000,  // 5 minutes
});
```

3. **Batch Requests** (where applicable):
```typescript
// Scrape multiple hospitals in sequence
for (const hospital of hospitals) {
  await scrapeHospital(hospital.id);
  await new Promise(resolve => setTimeout(resolve, 1000)); // 1s delay
}
```

## Error Handling

### Standard Error Response

```typescript
{
  error: string;        // Human-readable error message
  code?: string;        // Error code
  details?: any;        // Additional error details
  suggestion?: string;  // Helpful suggestion
}
```

### Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| `INVALID_URL` | Malformed URL | Check URL format |
| `UNAUTHORIZED` | Invalid API key | Verify API key is correct |
| `RATE_LIMIT` | Too many requests | Wait and retry |
| `NO_CREDITS` | Out of AI credits | Add credits |
| `SCRAPE_FAILED` | Website scraping failed | Check website accessibility |
| `AI_ERROR` | AI processing error | Retry or contact support |

### Client-Side Error Handling

```typescript
try {
  const { data, error } = await supabase.functions.invoke('chat', {
    body: { messages }
  });

  if (error) {
    if (error.status === 429) {
      toast.error('Rate limit exceeded. Please wait.');
    } else if (error.status === 402) {
      toast.error('Out of AI credits. Please add more.');
    } else {
      toast.error(error.message || 'An error occurred');
    }
    return;
  }

  // Process successful response
} catch (error) {
  console.error('Unexpected error:', error);
  toast.error('An unexpected error occurred');
}
```

## Examples

### Complete Chat Integration

```typescript
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  async function sendMessage(content: string) {
    const userMessage: Message = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
          },
          body: JSON.stringify({
            messages: [...messages, userMessage]
          })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantMessage += content;
                setMessages(prev => {
                  const last = prev[prev.length - 1];
                  if (last?.role === 'assistant') {
                    return prev.slice(0, -1).concat({
                      ...last,
                      content: assistantMessage
                    });
                  }
                  return [...prev, { role: 'assistant', content: assistantMessage }];
                });
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return { messages, sendMessage, isLoading };
}
```

### Complete Hospital Scraping

```typescript
async function scrapeHospital(
  hospitalId: string,
  websiteUrl: string,
  options?: {
    firecrawlApiKey?: string;
    scraperApiKey?: string;
  }
) {
  const { data, error } = await supabase.functions.invoke('scrape-hospital', {
    body: {
      hospitalId,
      websiteUrl,
      ...options
    }
  });

  if (error) {
    console.error('Scraping error:', error);
    throw new Error(error.message || 'Scraping failed');
  }

  console.log(`Successfully scraped ${data.pagesScraped} pages`);
  console.log(`Method: ${data.method}`);
  
  return data;
}

// Usage
try {
  await scrapeHospital(
    'hospital-uuid',
    'https://hospital.com',
    { firecrawlApiKey: 'fc-xxxxx' }
  );
} catch (error) {
  console.error(error);
}
```

### Batch Operations with Progress

```typescript
async function bulkScrape(
  hospitals: Array<{ id: string; url: string }>,
  onProgress: (current: number, total: number) => void
) {
  const results = [];
  
  for (let i = 0; i < hospitals.length; i++) {
    const hospital = hospitals[i];
    onProgress(i + 1, hospitals.length);
    
    try {
      const result = await scrapeHospital(hospital.id, hospital.url);
      results.push({ hospitalId: hospital.id, success: true, ...result });
    } catch (error) {
      results.push({ 
        hospitalId: hospital.id, 
        success: false, 
        error: error.message 
      });
    }
    
    // Rate limiting: wait 2s between requests
    if (i < hospitals.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return results;
}
```

---

For more examples, see the source code in `src/hooks/` and `src/pages/`.
