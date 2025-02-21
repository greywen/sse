interface ChatCompletionResponse {
  id: string;
  choices: ChatCompletionChoice[];
  tool_calls?: ToolCall[];
  usage: Usage;
  created: number;
  model: string;
  object: string;
}

interface ChatCompletionChoice {
  delta: {
    content: string;
    reasoning_content: string;
    role: string;
  };
  message: ChatCompletionMessage;
  finish_reason: string;
}

interface ChatCompletionMessage {
  role: string;
  content: string;
  reasoning_content: string;
}

interface ToolCall {
  id: string;
  type: 'function';
  function: FunctionCall;
}

interface FunctionCall {
  name: string;
  arguments: string;
}

interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}
