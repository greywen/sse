import Link from 'next/link';
import { useState } from 'react';

export default function ExampleOne() {
  const [message, setMessage] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const send = async () => {
    setMessage('');
    setIsSending(true);
    const response = await fetch('/api/sse', {
      method: 'POST',
    });
    if (!response.ok) return;

    const reader = response.body?.getReader();
    if (!reader) return;

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
          // 检查行是否以 'data: ' 开头，这是 SSE (Server-Sent Events) 的格式
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            // 如果接收到的是特殊标记 '[DONE]'，说明数据流结束，直接返回
            if (data === '[DONE]') {
              setIsSending(false);
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
            disabled={isSending}
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
