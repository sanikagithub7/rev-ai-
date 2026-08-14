/**
 * Centralized LLM Provider Abstraction Layer
 * Keeps AI provider logic separate from business logic.
 */

export interface LLMRequestPayload {
  prompt: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMResponsePayload {
  text: string;
  model: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export abstract class AIProvider {
  abstract generateCompletion(
    payload: LLMRequestPayload
  ): Promise<LLMResponsePayload>;
}

export class OpenAIProvider extends AIProvider {
  async generateCompletion(
    payload: LLMRequestPayload
  ): Promise<LLMResponsePayload> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey.includes("your-openai")) {
      return {
        text: `[AI Provider Demo Response] Processing prompt: ${payload.prompt.substring(0, 50)}...`,
        model: payload.model || "gpt-4o",
        tokensUsed: { prompt: 10, completion: 20, total: 30 },
      };
    }

    return {
      text: `[AI Provider Response] Input: ${payload.prompt.substring(0, 50)}...`,
      model: payload.model || "gpt-4o",
      tokensUsed: { prompt: 10, completion: 20, total: 30 },
    };
  }
}

export function getAIProvider(): AIProvider {
  return new OpenAIProvider();
}
