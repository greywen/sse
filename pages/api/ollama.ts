import { sleep } from '@/utils/common';
import type { NextApiRequest, NextApiResponse } from 'next';
import text from '../../data/data.json';

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  let cursor = 0;
  while (cursor < text.content.length) {
    const randomLength = Math.floor(Math.random() * 10) + 1;
    const chunk = text.content.slice(cursor, cursor + randomLength);
    cursor += randomLength;

    res.write(`data: ${chunk}\n\n`);

    await sleep(100);
  }

  res.write('data: [DONE]\n\n');
  res.end();
}
