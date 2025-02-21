import type { NextApiRequest, NextApiResponse } from 'next';
import { ReqBody, SSEResultType } from '@/types/common';

function writeBySSE(res: NextApiResponse, data: any) {
  res.write(Buffer.from(`data: ${JSON.stringify(data)}\n\n`));
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const options = {
    method: 'POST',
    headers: {
      Authorization:
        'Bearer sk-',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-ai/DeepSeek-R1',
      messages: [
        {
          role: 'user',
          content: '简单描述一下三国华容道。20字以内',
        },
      ],
      stream: true,
    }),
  };

  const response = await fetch(
    'https://api.siliconflow.cn/v1/chat/completions',
    options
  );

  if (!response.ok) {
    writeBySSE(res, { t: SSEResultType.Error, r: 'HTTP请求报错' });
    res.end();
  }

  const reader = response.body?.getReader();
  if (!reader) {
    writeBySSE(res, { t: SSEResultType.Error, r: '读取流报错' });
    res.end();
  }

  let buffer = '';
  const decoder = new TextDecoder();

  while (true) {
    const { value, done } = await reader!.read();
    if (done) {
      break;
    }

    if (value) {
      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      let lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const l = line.slice(6);
          console.log(l);
          if (l === '[DONE]') {
            writeBySSE(res, { t: SSEResultType.End });
            res.end();
            return;
          }
          const data: ChatCompletionResponse = JSON.parse(l);
          if (data.choices && data.choices[0]) {
            const choice = data.choices[0];
            if (choice.delta.reasoning_content) {
              writeBySSE(res, {
                t: SSEResultType.Think,
                r: choice.delta.reasoning_content,
              });
            } else if (choice.delta.content) {
              writeBySSE(res, {
                t: SSEResultType.Text,
                r: choice.delta.content,
              });
            } else if (choice.finish_reason === 'stop') {
              writeBySSE(res, { t: SSEResultType.End, r: chunk });
            }
          }
        }
      }
    }
  }
}
