// claude.ts — shim, all logic is in ai.ts
export {
  askAI, askAI as askClaude,
  askAIJSON, askAIJSON as askClaudeJSON,
  askAIWithSearch, askAIWithSearch as askClaudeWithSearch,
  streamAI, streamAI as streamClaude,
  getActiveEngine, ENGINE,
} from "./ai";
export type { AIMessage, AIMessage as ClaudeMessage } from "./ai";
