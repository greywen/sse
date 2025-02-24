import { SseResponseLine, SSEResultType } from '@/types/common';
import Link from 'next/link';
import { useState } from 'react';

type Message = {
  messageId: string;
  content: string;
  image: string;
  think: string;
  errorMsg: string;
  isCancelled: boolean;
};

const initMsg: Message = {
  messageId: 'e4aed4be-677c-4b3c-b8d1-ea4791b765c0',
  content: '',
  image: '',
  think: '',
  errorMsg: '',
  isCancelled: false,
};

export default function Deepseek() {
  const [message, setMessage] = useState<Message>(initMsg);
  const [isSending, setIsSending] = useState(false);
  const [userContent, setUserContent] = useState('');

  const send = async () => {
    try {
      setMessage(initMsg);
      setUserContent('');
      setIsSending(true);
      const response = await fetch('/api/deepseek', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId: message.messageId,
          userContent: userContent,
        }),
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
      if (typeof error === 'string') {
        setMessage((prev) => {
          return { ...prev, errorMsg: error };
        });
      }
      setIsSending(false);
    }
  };

  const stop = async () => {
    await fetch('/api/stop', {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({ messageId: message.messageId }),
    });
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
                {message.content || message.isCancelled
                  ? '思考完成'
                  : '思考中 ...'}
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
          <input
            className='border p-2 rounded-md'
            type='text'
            placeholder='输出一条消息'
            value={userContent}
            onChange={(e) => {
              setUserContent(e.target.value);
            }}
          ></input>
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
