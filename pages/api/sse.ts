import { sleep } from '@/utils/common';
import type { NextApiRequest, NextApiResponse } from 'next';
import data from '../../data/data.json';
import { ReqBody, SSEResultType } from '@/types/common';

function writeBySSE(res: NextApiResponse, data: any) {
  res.write(Buffer.from(`data: ${JSON.stringify(data)}\n\n`));
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { showHTTPError, showSSEError }: ReqBody = req.body;
  if (showHTTPError) {
    res.status(400);
    res.end();
  }

  const showErrorCount = Math.floor(Math.random() * data.think.length - 1);

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

  cursor = 0;
  while (cursor < data.content.length) {
    const randomLength = Math.floor(Math.random() * 10) + 1;
    const chunk = data.content.slice(cursor, cursor + randomLength);
    cursor += randomLength;

    writeBySSE(res, { t: SSEResultType.Text, r: chunk });

    await sleep(50);
  }

  writeBySSE(res, { t: SSEResultType.End });
  res.end();
}
