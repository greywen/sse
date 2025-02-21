import type { NextApiRequest, NextApiResponse } from 'next';

const dataStr = `却说曹操兵败赤壁，狼狈逃窜，行至华容道，前有泥泞，后有追兵，天寒地冻，士卒饥疲不堪，丢盔弃甲，状甚惨烈。正行之间，忽见前方关云长横刀立马，威风凛凛，拦住去路。曹操见之，心惊胆战，叹曰：“今日天命休矣！”

云长策马上前，厉声喝道：“曹贼！当日白马坡前，吾不杀汝，念旧恩耳！今汝兵败如山，何不伏法，以谢天下？”

曹操见关羽怒目而视，急忙下马，拱手作揖道：“云长，往日之恩，操铭刻肺腑。今若得存性命，必当以万金相报！”

关羽闻言，心下踌躇，思量道：“昔日曹丞相厚待于我，恩若山海，今杀之，恐为天下人所议；然若释之，恐违兄长之命。事关大义，何去何从？”

正犹豫间，曹操身旁众将纷纷跪地哀告，或泣或拜，关羽终念旧恩，长叹一声，挥手道：“念汝昔日待我恩重，今日放汝一条生路！然若再为祸乱，吾必取汝首级！”

曹操闻言，大喜过望，连连叩谢，急忙率众趁夜奔逃。此一义释，成就关羽忠义之名，亦使曹操免遭绝命之厄，千古传颂。`;

async function sleep(ms: number): Promise<null> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(null), ms);
  });
}

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  let cursor = 0;
  while (cursor < dataStr.length) {
    const randomLength = Math.floor(Math.random() * 10) + 1;
    const chunk = dataStr.slice(cursor, cursor + randomLength);
    cursor += randomLength;

    res.write(`data: ${chunk}\n\n`);

    await sleep(100);
  }

  res.write('data: [DONE]\n\n');
  res.end();
}
