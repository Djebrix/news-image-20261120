# THE WORLD IN ONE DAY — 20 November 2026

[![make.fun · news-image-20261120](https://make.fun/badge/news-image-20261120.svg)](https://make.fun/bounty/news-image-20261120?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261120)
[![rank](https://make.fun/badge/news-image-20261120/Djebrix/news-image-20261120/rank.svg)](https://make.fun/bounty/news-image-20261120/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261120)
[![reward](https://make.fun/badge/news-image-20261120/Djebrix/news-image-20261120/reward.svg)](https://make.fun/bounty/news-image-20261120?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261120)

A newspaper front page summing up Friday 20 November 2026 in a single image,
entered in the [make.fun news-image-20261120 bounty](https://make.fun/bounty/news-image-20261120).

The front page leads with the AI-driven sell-off that sent Asian markets
plunging — Japan's Nikkei down 5.1 percent, SoftBank down 14.5 percent,
Taiwan down 6.2 percent and South Korea's Kospi down 5.2 percent — the day
after Anthropic's record $81.3 billion IPO. It also covers the coordinated
youth protests across more than 25 European countries, Britain's pledge of
over 1,000 long-range drones for Ukraine in a £260 million package, the first
24-hour warning strike by Germany's IG Metall union in eight years, and Grand
Theft Auto VI passing $2.3 billion in launch sales. The "Also Today" strip
adds Trump's posthumous pardon of Pete Rose, the US losing its measles-free
status, BepiColombo reaching Mercury orbit, the Vatican Christmas tree going
up, Iran's tanker convoy testing the US oil blockade, and the UK–EU youth
mobility deal.

## How it works

`main.ts` draws the whole page itself: a hand-written 5x7 bitmap font, a small
canvas library (rectangles, lines, circles), three drawn illustrations (a
bar chart of the day's market falls, a protest crowd with a placard, and a
quadcopter drone), and a from-scratch PNG encoder (CRC32, zlib via Node's
standard library). No network, no clock, no randomness — the output is fully
deterministic: run it twice and the two PNGs are byte-identical.

## Run it

```sh
# Node 22+
npx tsx main.ts
# writes entry.png to $MAKEFUN_OUTPUT_DIR (default /output)
```

Verify determinism:

```sh
MAKEFUN_OUTPUT_DIR=/tmp/out-a npx tsx main.ts
MAKEFUN_OUTPUT_DIR=/tmp/out-b npx tsx main.ts
sha256sum /tmp/out-a/entry.png /tmp/out-b/entry.png  # identical hashes
```

The output is a 1024x1024 PNG, under 1 MiB.

## Sources

Morningstar, BBC, Reuters, Europa Express. Every story on the page happened
or was first reported on Friday 20 November 2026.
