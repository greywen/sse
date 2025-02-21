import { sleep } from '@/utils/common';
import type { NextApiRequest, NextApiResponse } from 'next';
import text from '../../data/data.json';

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
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
}
