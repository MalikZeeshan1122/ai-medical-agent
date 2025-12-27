export interface APITemplate {
  name: string;
  description: string;
  category: string;
  baseUrl: string;
  apiName: string;
  config: {
    tools: Array<{
      type: string;
      function: {
        name: string;
        description: string;
        parameters: {
          type: string;
          properties: Record<string, any>;
          required: string[];
        };
      };
    }>;
  };
  requiresApiKey: boolean;
  setupInstructions: string;
}

export const apiTemplates: APITemplate[] = [
  {
    name: "OpenWeatherMap",
    description: "Get current weather, forecasts, and historical weather data",
    category: "Weather",
    baseUrl: "https://api.openweathermap.org/data/2.5",
    apiName: "openweathermap",
    requiresApiKey: true,
    setupInstructions: "Get your free API key from openweathermap.org/api",
    config: {
      tools: [
        {
          type: "function",
          function: {
            name: "get_current_weather",
            description: "Get current weather for a city",
            parameters: {
              type: "object",
              properties: {
                endpoint: { type: "string", enum: ["/weather"], description: "API endpoint" },
                method: { type: "string", enum: ["GET"], description: "HTTP method" },
                query_params: {
                  type: "object",
                  properties: {
                    q: { type: "string", description: "City name" },
                    units: { type: "string", enum: ["metric", "imperial"], description: "Temperature units" }
                  },
                  required: ["q"]
                }
              },
              required: ["endpoint", "method", "query_params"]
            }
          }
        }
      ]
    }
  },
  {
    name: "NewsAPI",
    description: "Get breaking news headlines and search news articles",
    category: "News",
    baseUrl: "https://newsapi.org/v2",
    apiName: "newsapi",
    requiresApiKey: true,
    setupInstructions: "Get your free API key from newsapi.org/register",
    config: {
      tools: [
        {
          type: "function",
          function: {
            name: "get_top_headlines",
            description: "Get top news headlines",
            parameters: {
              type: "object",
              properties: {
                endpoint: { type: "string", enum: ["/top-headlines"], description: "API endpoint" },
                method: { type: "string", enum: ["GET"], description: "HTTP method" },
                query_params: {
                  type: "object",
                  properties: {
                    country: { type: "string", description: "Country code (e.g., us, gb)" },
                    category: { type: "string", enum: ["business", "entertainment", "health", "science", "sports", "technology"] }
                  }
                }
              },
              required: ["endpoint", "method"]
            }
          }
        }
      ]
    }
  },
  {
    name: "Alpha Vantage",
    description: "Get stock market data, forex rates, and cryptocurrency prices",
    category: "Finance",
    baseUrl: "https://www.alphavantage.co/query",
    apiName: "alphavantage",
    requiresApiKey: true,
    setupInstructions: "Get your free API key from alphavantage.co/support/#api-key",
    config: {
      tools: [
        {
          type: "function",
          function: {
            name: "get_stock_quote",
            description: "Get real-time stock quote",
            parameters: {
              type: "object",
              properties: {
                endpoint: { type: "string", enum: [""], description: "Base endpoint" },
                method: { type: "string", enum: ["GET"], description: "HTTP method" },
                query_params: {
                  type: "object",
                  properties: {
                    function: { type: "string", enum: ["GLOBAL_QUOTE"], description: "API function" },
                    symbol: { type: "string", description: "Stock symbol (e.g., AAPL)" }
                  },
                  required: ["function", "symbol"]
                }
              },
              required: ["endpoint", "method", "query_params"]
            }
          }
        }
      ]
    }
  },
  {
    name: "REST Countries",
    description: "Get information about countries, including population, area, and languages",
    category: "Geography",
    baseUrl: "https://restcountries.com/v3.1",
    apiName: "restcountries",
    requiresApiKey: false,
    setupInstructions: "No API key required - ready to use immediately",
    config: {
      tools: [
        {
          type: "function",
          function: {
            name: "get_country_info",
            description: "Get information about a country",
            parameters: {
              type: "object",
              properties: {
                endpoint: { type: "string", description: "Endpoint path (e.g., /name/usa)" },
                method: { type: "string", enum: ["GET"], description: "HTTP method" }
              },
              required: ["endpoint", "method"]
            }
          }
        }
      ]
    }
  },
  {
    name: "ExchangeRate-API",
    description: "Get real-time and historical currency exchange rates",
    category: "Finance",
    baseUrl: "https://v6.exchangerate-api.com/v6",
    apiName: "exchangerate",
    requiresApiKey: true,
    setupInstructions: "Get your free API key from exchangerate-api.com",
    config: {
      tools: [
        {
          type: "function",
          function: {
            name: "get_exchange_rates",
            description: "Get latest exchange rates for a currency",
            parameters: {
              type: "object",
              properties: {
                endpoint: { type: "string", description: "Endpoint with API key (e.g., /YOUR-API-KEY/latest/USD)" },
                method: { type: "string", enum: ["GET"], description: "HTTP method" }
              },
              required: ["endpoint", "method"]
            }
          }
        }
      ]
    }
  },
  {
    name: "JokeAPI",
    description: "Get random jokes in various categories",
    category: "Entertainment",
    baseUrl: "https://v2.jokeapi.dev/joke",
    apiName: "jokeapi",
    requiresApiKey: false,
    setupInstructions: "No API key required - ready to use immediately",
    config: {
      tools: [
        {
          type: "function",
          function: {
            name: "get_random_joke",
            description: "Get a random joke",
            parameters: {
              type: "object",
              properties: {
                endpoint: { type: "string", enum: ["/Any"], description: "Joke category endpoint" },
                method: { type: "string", enum: ["GET"], description: "HTTP method" }
              },
              required: ["endpoint", "method"]
            }
          }
        }
      ]
    }
  }
];

export const templateCategories = Array.from(new Set(apiTemplates.map(t => t.category))).sort();
