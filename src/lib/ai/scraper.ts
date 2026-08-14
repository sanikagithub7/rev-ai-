import { URL } from "url";

export interface ScrapeResult {
  success: boolean;
  content?: string;
  error?: string;
}

/**
 * Validates a website URL and guards against SSRF (Server-Side Request Forgery).
 */
export function validateScrapeUrl(urlString: string): { valid: boolean; error?: string; parsedUrl?: URL } {
  if (!urlString || typeof urlString !== "string") {
    return { valid: false, error: "URL is required." };
  }

  let formattedUrl = urlString.trim();
  if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
    formattedUrl = `https://${formattedUrl}`;
  }

  try {
    const parsed = new URL(formattedUrl);

    // Protocol check
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { valid: false, error: "Only HTTP and HTTPS protocols are supported." };
    }

    const hostname = parsed.hostname.toLowerCase();

    // SSRF / Private network IP block list
    const isPrivate =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "::1" ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal") ||
      /^10\./.test(hostname) ||
      /^172\.(1[6-9]|2[0-9]|3[01])\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^169\.254\./.test(hostname);

    if (isPrivate) {
      return { valid: false, error: "Access to local or internal network addresses is blocked for security reasons." };
    }

    return { valid: true, parsedUrl: parsed };
  } catch {
    return { valid: false, error: "Invalid URL format." };
  }
}

/**
 * Server-side website fetcher with 10s timeout and clean text extraction.
 */
export async function scrapeWebsiteContent(urlInput: string): Promise<ScrapeResult> {
  const validation = validateScrapeUrl(urlInput);
  if (!validation.valid || !validation.parsedUrl) {
    return { success: false, error: validation.error || "Invalid URL" };
  }

  const targetUrl = validation.parsedUrl.toString();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) RevAI-LeadScraper/1.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { success: false, error: `Website returned status ${response.status}` };
    }

    const html = await response.text();

    if (!html || html.trim().length === 0) {
      return { success: false, error: "Website could not be analyzed." };
    }

    // Strip scripts, styles, and HTML tags for LLM text analysis
    const cleanText = html
      .replace(/<script\b[^<]*>([\s\S]*?)<\/script>/gi, "")
      .replace(/<style\b[^<]*>([\s\S]*?)<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (cleanText.length < 50) {
      return { success: false, error: "Insufficient website data for reliable analysis." };
    }

    // Limit text context length for optimal Ollama processing
    return { success: true, content: cleanText.slice(0, 4000) };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      return { success: false, error: "Website fetch timed out." };
    }
    return { success: false, error: "Website could not be analyzed." };
  }
}
