# [从文本到图像：SSE 如何助力 AI 内容实时呈现？](https://github.com/greywen/sse)

## 前言

在这个人工智能大模型日益普及的时代，AI 的能力从最初的简单文本回复，发展到了生成图像，甚至可以实时输出思考过程。那么，问题来了：这些多样化的数据是如何高效地从后端传递到前端的呢？今天，我们就来聊聊一种轻量级、简单又实用的技术——SSE（Server-Sent Events）。

## [SSE(server-sent events)](https://developer.mozilla.org/zh-CN/docs/Web/API/Server-sent_events/Using_server-sent_events)

一句话概括: SSE（Server-Sent Events）是一种基于 HTTP 的轻量级协议，允许服务端通过长连接向客户端单向实时推送结构化文本数据流。

### 它有哪些特点？

- 简单易用：前端和后端代码实现起来非常简单。
- 长连接：使用 HTTP 持久连接，适合持续推送数据。
- 单向通信：服务端推送，前端接收，不支持前端主动发消息。
- 轻量高效：相比 WebSocket 更加轻量。

### JSON返回 vs SSE vs WebSocket 有什么区别

JSON 返回：

```typescript
const response = await fetch('https://');
await response.json();
```

流式返回：

```typescript
const response = await fetch('https://');
const reader = response.body?.getReader();
while (true) {
  const { value, done } = await reader.read();
}
```

WebSocket：

```typescript
const socket = new WebSocket('ws://');
socket.onopen = () => {};
socket.onmessage  = () => {};
```

| 特性         | `response.json()`           | `ReadableStream`                | `WebSocket`                                  |
| ------------ | --------------------------- | -------------------------------- | ------------------------------------------- |
| **处理方式** | 全量读取，自动 JSON 解析    | 按块（chunk）逐步读取响应体，手动处理 | 双向通信：可持续接收和发送消息                |
| **内存占用** | 可能较高                   | 较低                             | 取决于消息频率和大小，但通常开销较低         |
| **复杂性**   | 简单                       | 相对复杂                         | 需要手动处理连接、消息事件、错误等            |
| **适用场景** | 小到中等大小 JSON 响应      | 大型文件、实时数据、非 JSON 数据 | 实时双向通信场景，例如聊天应用、在线游戏等   |
| **实时性**   | 无法实时                    | 可以通过流式返回实现接近实时     | 原生支持实时通信，延迟低                     |
| **协议**     | HTTP                        | HTTP                             | WebSocket（基于 HTTP 升级的全双工协议）      |
| **连接状态** | 每次请求独立连接            | 每次请求独立连接                 | 长连接：连接建立后可持续使用                  |
| **服务端推送**| 不支持                    | 不支持                          | 原生支持：服务端主动推送消息到客户端         |

## 浅入浅出

[展示视频](https://raw.githubusercontent.com/greywen/sse/refs/heads/main/videos/dome01.avif)

我们通过一个简单的例子来了解服务端如何通过 SSE 向前端推送数据。

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

核心逻辑：

- 通过 res.write 向客户端发送数据块（以 data: 开头，符合 SSE 格式）。
- 每次发送后稍作延迟（模拟数据生成的过程）。
- 发送完所有数据后，用 [DONE] 标记结束。

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

核心逻辑：

- 通过流式读取服务端返回的数据
- 流数据解码为字符串并解析 SSE 数据格式
- 接收到结束标记 [DONE] 结束

有了基础实现之后，接下来我们看看一些稍微复杂一点的场景，比如：

- 如何处理错误？
- 如何控制 SSE 请求的中断？
- 如何支持更复杂的数据结构，比如 JSON 格式？图片？

## 进阶

[展示视频](https://raw.githubusercontent.com/greywen/sse/refs/heads/main/videos/dome02.avif)

[展示视频](https://raw.githubusercontent.com/greywen/sse/refs/heads/main/videos/dome03.avif)

1. 将 SSE 返回的数据结构需改为 JSON 格式

```json
{ "t": "返回类型", "r": "返回内容" }
```

2. 前端使用 AbortController 来控制是否结束当前请求（但是在实际使用过程中可能需要其他方案）

```typescript
const response = await fetch('/api/sse', {
  signal: abortController.signal,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ ...reqBody }),
});
```

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
  }
}
```

## 实战

[展示视频](https://raw.githubusercontent.com/greywen/sse/refs/heads/main/videos/dome04.avif)

源代码地址: [Github](https://github.com/greywen/sse)

## 总结

SSE 是一种简单而有效的技术，特别适用于需要从服务器向客户端实时推送数据的场景。相对于 WebSocket，它更加轻量，实现也更简单。文章通过示例代码和视频演示，清晰地展示了 SSE 的基本原理和进阶用法，以及在实际项目中的应用。

#### 支持我们！

本文来自 Sdcb Chats 部分代码，如果您觉得有帮助请在 [GitHub](https://github.com/sdcb/chats) 上 Star 我们！您的支持是我们前进的动力。

再次感谢您的支持，期待未来为您带来更多惊喜！
