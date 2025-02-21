# SSE(server-sent events) 服务器发送事件

## 前言

在这个人工智能大模型日益普及的时代，AI 的能力已经从最初的简单文本回复，发展到生成图像，甚至开始输出思考过程。那么，AI 大模型是如何将这些不同形式的数据高效地传递给前端应用的呢？

## [SSE(server-sent events)](https://developer.mozilla.org/zh-CN/docs/Web/API/Server-sent_events/Using_server-sent_events)

一句话概括: SSE（Server-Sent Events）是一种基于 HTTP 的轻量级协议，允许服务端通过长连接向客户端单向实时推送结构化文本数据流。

## 浅入浅出

[展示视频]()

后端代码:

```typescript
let cursor = 0;
while (cursor < text.content.length) {
  const randomLength = Math.floor(Math.random() * 10) + 1;
  // 从当前光标位置切片文本，生成一个块
  const chunk = text.content.slice(cursor, cursor + randomLength);
  cursor += randomLength;

  // 将数据块以 SSE 格式发送到客户端
  res.write(`data: ${chunk}\n\n`);

  await sleep(100);
}

// 当所有数据发送完成时，发送一个特殊的结束标记
res.write('data: [DONE]\n\n');
res.end();
```

前端代码：

```typescript
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
          return;
        }
        setMessage((prev) => {
          return (prev += data);
        });
      }
    }
  }
}
```

短短几十行代码模拟一个简单的 SEE 功能。

这个时候有小伙伴就问 SEE 输出到一半想结束怎么办？SEE 报错了如何处理？SEE 如何输出图片？

## 进阶

[展示视频]()

将 SSE 返回的数据结构需改为 JSON 格式, 加入了数据返回类型图片/想法/错误等

后端代码：

```typescript
let cursor = 0;
writeBySSE(res, { t: SSEResultType.Image, r: data.imageUrl });

while (cursor < data.think.length) {
  const randomLength = Math.floor(Math.random() * 10) + 1;
  const chunk = data.think.slice(cursor, cursor + randomLength);
  cursor += randomLength;
  if (showSSEError && cursor > showErrorCount) {
    writeBySSE(res, { t: SSEResultType.Error, r: '发生错误！' });
    res.end();
  }
  writeBySSE(res, { t: SSEResultType.Think, r: chunk });

  await sleep(50);
}
```

前端代码：

```typescript
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
  }
}
```

## 实战！

[展示视频]()
