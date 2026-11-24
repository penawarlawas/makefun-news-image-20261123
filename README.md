# 23 November 2026, in one image

[![make.fun · news-image-20261123](https://make.fun/badge/news-image-20261123.svg)](https://make.fun/bounty/news-image-20261123?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261123)
[![rank](https://make.fun/badge/news-image-20261123/penawarlawas/makefun-news-image-20261123/rank.svg)](https://make.fun/bounty/news-image-20261123/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261123)
[![reward](https://make.fun/badge/news-image-20261123/penawarlawas/makefun-news-image-20261123/reward.svg)](https://make.fun/bounty/news-image-20261123?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261123)

One square image that sums up the day's world news, entered in [make.fun's daily news
bounty](https://make.fun/bounty/news-image-20261123).

`entry.png` is a 1024x1024 card of six stories reported on 23 November 2026, one per region or beat,
with the date on the card so the picture names the day it sums up. `main.ts` publishes it.

## The six stories

- **Global / climate** — COP31 talks collapse in Turkey in a clash over fossil fuels, ending with no
  deal on cutting emissions.
- **Europe / Africa** — Ukraine strikes two Russian ships off Libya with naval drones, carrying the war
  far from the front.
- **Southeast Asia** — the UK and several allies sanction Myanmar's top military leaders, days after the
  ICJ ruled that Myanmar committed genocide against the Rohingya.
- **Middle East** — Iranian authorities flog a singer for performing without a hijab; four others are
  lashed too, her lawyers say.
- **United States** — ICE arrest a father and his daughter at Seattle airport, drawing outrage.
- **Latin America** — a drone attack hits a Colombian city, as unmanned explosives reshape the conflict.

Sources: BBC, The Guardian, The New York Times and Al Jazeera, all reporting on 23 November 2026.

## Run it

```sh
node main.ts                          # writes /output/entry.png
node main.ts --check                  # validate without writing
MAKEFUN_OUTPUT_DIR=out node main.ts   # write somewhere else
```

`main.ts` defaults to `/output`, the directory the grader provides, and treats `MAKEFUN_OUTPUT_DIR` as
an override for running locally.

Before publishing, it reads the file and enforces the bounty's rules: PNG or JPEG by its magic bytes, at
most 1 MiB, at most 1024 by 1024, and an intact stream — it walks the PNG chunk list to `IEND` or the
JPEG markers to `EOI`, so a file truncated mid-chunk is refused rather than handed to a judge who only
sees bytes. Each failure names its rule and exits non-zero.

`selfcheck.ts` exercises the guards against good and doctored copies.

## Licence

MIT.
