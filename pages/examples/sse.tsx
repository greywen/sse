import { ReqBody, SseResponseLine, SSEResultType } from '@/types/common';
import Link from 'next/link';
import { useState } from 'react';

type Message = {
  content: string;
  image: string;
  think: string;
  errorMsg: string;
  isCancelled: boolean;
};

const initMsg: Message = {
  content: '',
  image: '',
  think: '',
  errorMsg: '',
  isCancelled: false,
};

let abortController: AbortController | null = null;

export default function SSE() {
  const [message, setMessage] = useState<{
    content: string;
    image: string;
    think: string;
    errorMsg: string;
    isCancelled: boolean;
  }>(initMsg);
  const [isSending, setIsSending] = useState(false);
  const [reqBody, setReqBody] = useState<ReqBody>({
    showHTTPError: false,
    showSSEError: false,
  });

  const send = async () => {
    try {
      abortController = new AbortController();
      setMessage(initMsg);
      setIsSending(true);
      const response = await fetch('/api/sse', {
        signal: abortController.signal,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...reqBody }),
      });
      if (!response.ok) {
        throw 'HTTP请求报错';
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw '读取流报错';
      }

      // 初始化一个缓冲区，用于存储未处理的流数据
      let buffer = '';
      // 创建一个 TextDecoder，用于将流数据解码为字符串
      const decoder = new TextDecoder();

      while (true) {
        // 从流中读取下一个块（chunk）
        const { value, done } = await reader.read();
        // 如果流读取完成（done 为 true），退出循环
        if (done) {
          break;
        }

        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          // 按照双换行符（\n\n）将缓冲区拆分为多行
          let lines = buffer.split('\n\n');
          // 将最后一行（可能是不完整的行）存回缓冲区，等待下一次读取补全
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const l = line.slice(6);
              const data: SseResponseLine = JSON.parse(l);
              if (data.t === SSEResultType.Image) {
                setMessage((prev) => {
                  return { ...prev, image: data.r };
                });
              } else if (data.t === SSEResultType.Think) {
                setMessage((prev) => {
                  const newThink = prev.think + data.r;
                  if (prev.think === newThink) return prev;
                  return { ...prev, think: newThink };
                });
              } else if (data.t === SSEResultType.Text) {
                setMessage((prev) => {
                  const newContent = prev.content + data.r;
                  if (prev.content === newContent) return prev;
                  return { ...prev, content: newContent };
                });
              } else if (data.t === SSEResultType.Cancelled) {
                setMessage((prev) => {
                  return { ...prev, isCancelled: true };
                });
                setIsSending(false);
              } else if (data.t === SSEResultType.End) {
                setIsSending(false);
              } else if (data.t === SSEResultType.Error) {
                setMessage((prev) => {
                  return { ...prev, errorMsg: data.r };
                });
                setIsSending(false);
              }
              console.log(data);
            }
          }
        }
      }
    } catch (error: any) {
      if (error?.code === 20) {
        setMessage((prev) => {
          return { ...prev, isCancelled: true };
        });
      } else if (typeof error === 'string') {
        setMessage((prev) => {
          return { ...prev, errorMsg: error };
        });
      }
      setIsSending(false);
    }
  };

  const stop = () => {
    abortController?.abort();
  };

  return (
    <div className='relative h-screen p-2'>
      <div className='border rounded-md p-2'>
        <p>
          {message.image && (
            <img className='w-1/5 h-1/5 rounded-md pb-2' src={message.image} />
          )}
        </p>
        {message.think && (
          <>
            {
              <p className='text-gray-500 text-sm pb-2'>
                {!message.content ? '思考中 ...' : '思考完成'}
              </p>
            }
            <p className='text-gray-500 text-sm pb-2'>{message.think}</p>
          </>
        )}
        <p>{message.content}</p>
        <p className='text-red-600 text-sm font-bold'>{message.errorMsg}</p>
        {message.isCancelled && (
          <p className='text-yellow-600 text-sm font-bold'>用户取消操作</p>
        )}
      </div>
      <div className='absolute left-1/2 bottom-2 -translate-x-1/2'>
        <div className='flex gap-6 items-center cursor-pointer select-none'>
          <p
            className='flex gap-1'
            onClick={() => {
              setReqBody({ ...reqBody, showSSEError: !reqBody.showSSEError });
            }}
          >
            <input type='checkbox' checked={reqBody.showSSEError} />
            模拟SSE报错
          </p>
          <p
            className='flex gap-1'
            onClick={() => {
              setReqBody({ ...reqBody, showHTTPError: !reqBody.showHTTPError });
            }}
          >
            <input type='checkbox' checked={reqBody.showHTTPError} />
            模拟HTTP请求报错
          </p>
          {isSending ? (
            <button
              type='button'
              className='border px-10 py-2 rounded-md'
              onClick={stop}
            >
              停止
            </button>
          ) : (
            <button
              disabled={isSending}
              type='button'
              className='border px-10 py-2 rounded-md'
              onClick={send}
            >
              发送
            </button>
          )}
          <Link href='/'>返回</Link>
        </div>
      </div>
    </div>
  );
}
