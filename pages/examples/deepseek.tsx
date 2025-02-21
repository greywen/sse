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

export default function Deepseek() {
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
      const response = await fetch('/api/deepseek', {
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

      let buffer = '';
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
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
              const data: SseResponseLine = JSON.parse(l);
              if (data.t === SSEResultType.Image) {
                setMessage((prev) => {
                  return { ...prev, image: data.r };
                });
              } else if (data.t === SSEResultType.Think) {
                setMessage((prev) => {
                  return { ...prev, think: (prev.think += data.r) };
                });
              } else if (data.t === SSEResultType.Text) {
                setMessage((prev) => {
                  return { ...prev, content: (prev.content += data.r) };
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
