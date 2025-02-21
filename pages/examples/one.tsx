import Link from 'next/link';
import { useState } from 'react';

export default function ExampleOne() {
  const [message, setMessage] = useState<string>('');
  const send = async () => {
    setMessage('');
    const response = await fetch('/api/one', {
      method: 'POST',
    });

    if (!response.ok) {
      return;
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder('utf-8');

    if (!reader) {
      return;
    }

    let done = false;
    let buffer = '';

    while (!done) {
      const { value, done: streamDone } = await reader.read();
      done = streamDone;

      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        let lines = buffer.split('\n\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return;
            }
            setMessage((prev) => {
              return (prev += data);
            });
            console.log(data);
          }
        }
      }
    }
  };

  return (
    <div className='relative h-screen'>
      <p>{message}</p>
      <div className='absolute left-1/2 top-1/2 -translate-x-1/2'>
        <div className='flex gap-6 items-center'>
          <button
            type='button'
            className='border px-10 py-2 rounded-md'
            onClick={send}
          >
            发送
          </button>
          <Link href='/'>返回</Link>
        </div>
      </div>
    </div>
  );
}
