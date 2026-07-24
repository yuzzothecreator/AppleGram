/**
 * AI assistant service.
 *
 * In production this should call your own backend / Supabase Edge Function
 * which holds the OpenAI key — NEVER ship the key in the app bundle.
 * For the MVP scaffold we return canned, context-aware responses.
 */

export async function askAssistant(prompt: string): Promise<string> {
  await new Promise((r) => setTimeout(r, 700));
  const p = prompt.toLowerCase();

  if (p.includes('summar')) {
    return 'Summary: The team finished auth and the chat list, realtime is next, and Amina is reviewing the bubble animations. No blockers reported.';
  }
  if (p.includes('translate')) {
    return 'Tell me the target language and the text, and I will translate it for you.';
  }
  if (p.includes('hello') || p.includes('hi')) {
    return 'Hi! I can draft replies, summarize conversations, transcribe voice notes, and answer questions. What would you like to do?';
  }
  return `Here's a helpful take on "${prompt}":\n\nI can expand on this, generate a reply you can send, or summarize a chat. Just tell me how you'd like to proceed.`;
}

export async function summarizeChat(messages: string[]): Promise<string> {
  await new Promise((r) => setTimeout(r, 600));
  if (!messages.length) return 'There is nothing to summarize yet.';
  return `Summary of ${messages.length} messages: the conversation covers project progress and next steps. Key action item: continue with realtime messaging.`;
}
