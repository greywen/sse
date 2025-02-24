import { removeMessageMap } from '@/utils/message';
import { NextApiRequest, NextApiResponse } from 'next';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    const { messageId }: { messageId: string } = req.body;
    removeMessageMap(messageId);
    res.end();
  }
};
