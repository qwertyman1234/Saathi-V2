/**
 * useAI.ts — React hook wrapping advanced AI calls with loading/error state
 */
import { useState, useCallback } from "react";
import { askClaude, streamClaude, type ClaudeMessage } from "@/lib/claude";

export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** One-shot call — returns full response string */
  const ask = useCallback(
    async (system: string, prompt: string, history: ClaudeMessage[] = []): Promise<string> => {
      setLoading(true);
      setError(null);
      try {
        const result = await askClaude(system, prompt, history);
        return result;
      } catch (e: any) {
        const msg = e?.message ?? "AI error";
        setError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /** Streaming call — pushes chunks via onChunk, calls onDone at end */
  const stream = useCallback(
    async (
      system: string,
      messages: ClaudeMessage[],
      onChunk: (t: string) => void,
      onDone: () => void
    ): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        await streamClaude(system, messages, onChunk, () => {
          setLoading(false);
          onDone();
        });
      } catch (e: any) {
        const msg = e?.message ?? "AI stream error";
        setError(msg);
        setLoading(false);
        throw e;
      }
    },
    []
  );

  return { loading, error, ask, stream };
}
