import type { NextApiRequest, NextApiResponse } from 'next';
import { SSEResultType } from '@/types/common';
import { getMessageMap, setMessageMap } from '@/utils/message';

function writeBySSE(res: NextApiResponse, data: any) {
  res.write(Buffer.from(`data: ${JSON.stringify(data)}\n\n`));
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { messageId, userContent }: { messageId: string; userContent: string } =
    req.body;
  setMessageMap(messageId);

  try {
    const response = await fetch(
      'https://api.siliconflow.cn/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.SILICON_FLOW_SECRET,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-ai/DeepSeek-R1',
          messages: [
            {
              role: 'user',
              content: userContent,
            },
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      // 根据需求变化
      throw 'HTTP请求错误';
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw '获取流错误';
    }

    let buffer = '';
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }

      if (!getMessageMap(messageId)) {
        reader.cancel();
        writeBySSE(res, { t: SSEResultType.Cancelled, r: '用户中止请求' });
        res.end();
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
  } catch (error: any) {
    // 统一错误处理
    writeBySSE(res, { t: SSEResultType.Error, r: error });
    res.end();
  }
}
