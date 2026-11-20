// THE WORLD IN ONE DAY — news-image-20261120
// Draws a newspaper front page summing up Friday 20 November 2026
// as a deterministic 1024x1024 PNG. Node 22 standard library only:
// no network, no clock, no randomness. Output goes to
// $MAKEFUN_OUTPUT_DIR/entry.png (default /output).

import * as fs from "node:fs";
import * as path from "node:path";
import { deflateSync } from "node:zlib";

// ---------------------------------------------------------------- canvas

const W = 1024;
const H = 1024;

const PAPER: RGB = [247, 243, 232];
const INK: RGB = [18, 18, 18];
const RED: RGB = [172, 32, 28];
const GREY: RGB = [118, 112, 100];
const WHITE: RGB = [250, 248, 242];

type RGB = [number, number, number];

const px = new Uint8Array(W * H * 3);

function fill(c: RGB): void {
  for (let i = 0; i < W * H; i++) {
    px[i * 3] = c[0];
    px[i * 3 + 1] = c[1];
    px[i * 3 + 2] = c[2];
  }
}

function setPixel(x: number, y: number, c: RGB): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = c[0];
  px[i + 1] = c[1];
  px[i + 2] = c[2];
}

function rect(x: number, y: number, w: number, h: number, c: RGB): void {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) setPixel(xx, yy, c);
  }
}

function hline(x: number, y: number, w: number, t: number, c: RGB): void {
  rect(x, y, w, t, c);
}

function vline(x: number, y: number, h: number, t: number, c: RGB): void {
  rect(x, y, t, h, c);
}

function circle(cx: number, cy: number, r: number, c: RGB, filled: boolean): void {
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      const d = (x - cx) * (x - cx) + (y - cy) * (y - cy);
      if (filled ? d <= r * r : d <= r * r && d >= (r - 1) * (r - 1)) {
        setPixel(x, y, c);
      }
    }
  }
}

function line(x0: number, y0: number, x1: number, y1: number, c: RGB): void {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  for (let i = 0; i <= steps; i++) {
    const x = Math.round(x0 + (dx * i) / steps);
    const y = Math.round(y0 + (dy * i) / steps);
    setPixel(x, y, c);
    setPixel(x + 1, y, c);
  }
}

// ------------------------------------------------------------- bitmap font
// 5x7 glyphs. '#' is ink, '.' is blank. Uppercase only; all copy is set
// in capitals. Unknown characters render as a hollow box.

const FONT: Record<string, string[]> = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ",": ["00000", "00000", "00000", "00000", "01100", "00100", "01000"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
  ";": ["00000", "01100", "01100", "00000", "01100", "00100", "01000"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "?": ["01110", "10001", "00001", "00110", "00100", "00000", "00100"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  $: ["00100", "01111", "10100", "01110", "00101", "11110", "00100"],
  "%": ["11001", "11010", "00010", "00100", "01000", "01011", "10011"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
  "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
  "=": ["00000", "00000", "11111", "00000", "11111", "00000", "00000"],
  '"': ["01010", "01010", "00000", "00000", "00000", "00000", "00000"],
  "*": ["00000", "10101", "01110", "11111", "01110", "10101", "00000"],
  "\u2022": ["00000", "00000", "01100", "01100", "00000", "00000", "00000"],
  "?": ["11111", "10001", "10101", "10101", "10001", "10001", "11111"],
};

const UNKNOWN = FONT["?"];

function glyphOf(ch: string): string[] {
  return FONT[ch] ?? UNKNOWN;
}

function normalize(s: string): string {
  return s
    .replace(/\u2014|\u2013/g, "-")
    .replace(/\u2019|\u2018/g, "'")
    .replace(/\u00b7/g, "\u2022")
    .toUpperCase();
}

function textWidth(s: string, scale: number): number {
  const t = normalize(s);
  if (t.length === 0) return 0;
  return t.length * 6 * scale - scale;
}

function drawText(s: string, x: number, y: number, scale: number, c: RGB): void {
  const t = normalize(s);
  for (let ci = 0; ci < t.length; ci++) {
    const g = glyphOf(t[ci]);
    const ox = x + ci * 6 * scale;
    for (let r = 0; r < 7; r++) {
      for (let col = 0; col < 5; col++) {
        if (g[r][col] === "1") {
          rect(ox + col * scale, y + r * scale, scale, scale, c);
        }
      }
    }
  }
}

function drawTextCentered(s: string, cx: number, y: number, scale: number, c: RGB): void {
  drawText(s, cx - Math.floor(textWidth(s, scale) / 2), y, scale, c);
}

function wrapText(s: string, maxWidth: number, scale: number): string[] {
  const words = normalize(s).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const trial = cur === "" ? w : cur + " " + w;
    if (textWidth(trial, scale) <= maxWidth) {
      cur = trial;
    } else {
      if (cur !== "") lines.push(cur);
      cur = w;
    }
  }
  if (cur !== "") lines.push(cur);
  return lines;
}

function drawParagraph(
  s: string,
  x: number,
  y: number,
  maxWidth: number,
  scale: number,
  lineHeight: number,
  c: RGB,
): number {
  const lines = wrapText(s, maxWidth, scale);
  for (let i = 0; i < lines.length; i++) {
    drawText(lines[i], x, y + i * lineHeight, scale, c);
  }
  return y + lines.length * lineHeight;
}

// ------------------------------------------------------------ illustrations

function drawBarChart(x: number, y: number, w: number, h: number): void {
  // Framed panel with four bars: Friday's falls in percent.
  rect(x, y, w, 2, INK);
  rect(x, y + h - 2, w, 2, INK);
  rect(x, y, 2, h, INK);
  rect(x + w - 2, y, 2, h, INK);
  drawText("FRIDAY'S FALLS - PERCENT CHANGE ON THE DAY", x + 16, y + 12, 1, GREY);
  const base = y + h - 34;
  hline(x + 16, base, w - 32, 2, INK);
  const bars: Array<[string, string, number]> = [
    ["NIKKEI", "-5.1%", 5.1],
    ["KOSPI", "-5.2%", 5.2],
    ["TAIEX", "-6.2%", 6.2],
    ["SOFTBANK", "-14.5%", 14.5],
  ];
  const bw = 92;
  const gap = Math.floor((w - 32 - bars.length * bw) / (bars.length + 1));
  const pxPerPoint = 5.4;
  for (let i = 0; i < bars.length; i++) {
    const [name, val, v] = bars[i];
    const bx = x + 16 + gap + i * (bw + gap);
    const bh = Math.round(v * pxPerPoint);
    rect(bx, base - bh, bw, bh, i === 3 ? RED : INK);
    drawTextCentered(val, bx + Math.floor(bw / 2), base - bh - 18, 2, RED);
    drawTextCentered(name, bx + Math.floor(bw / 2), base + 8, 1, INK);
  }
  // Red falling arrow across the top of the panel.
  line(x + 40, y + 34, x + w - 60, y + 52, RED);
  line(x + w - 60, y + 52, x + w - 78, y + 44, RED);
  line(x + w - 60, y + 52, x + w - 76, y + 62, RED);
}

function drawCrowd(x: number, y: number, w: number, h: number): void {
  // Two rows of heads and shoulders, plus one placard.
  for (let row = 0; row < 2; row++) {
    const cy = y + 12 + row * 26;
    const n = 9;
    for (let i = 0; i < n; i++) {
      const cx = x + 18 + i * Math.floor((w - 36) / (n - 1)) + (row % 2 === 1 ? 14 : 0);
      if (cx > x + w - 12) continue;
      circle(cx, cy, 8, INK, true);
      rect(cx - 11, cy + 8, 22, 12, INK);
    }
  }
  // Placard held above the crowd.
  rect(x + Math.floor(w / 2) - 52, y - 2, 104, 26, PAPER);
  rect(x + Math.floor(w / 2) - 52, y - 2, 104, 2, INK);
  rect(x + Math.floor(w / 2) - 52, y + 22, 104, 2, INK);
  rect(x + Math.floor(w / 2) - 52, y - 2, 2, 26, INK);
  rect(x + Math.floor(w / 2) + 50, y - 2, 2, 26, INK);
  drawTextCentered("FAIR PAY", x + Math.floor(w / 2), y + 5, 1, RED);
  line(x + Math.floor(w / 2) - 30, y + 24, x + Math.floor(w / 2) - 30, y + 34, INK);
  line(x + Math.floor(w / 2) + 30, y + 24, x + Math.floor(w / 2) + 30, y + 34, INK);
}

function drawDrone(x: number, y: number, w: number, h: number): void {
  // Simple quadcopter: four rotors, arms, body, camera.
  const cx = x + Math.floor(w / 2);
  const cy = y + Math.floor(h / 2);
  const arms: Array<[number, number]> = [
    [-58, -24],
    [58, -24],
    [-58, 24],
    [58, 24],
  ];
  for (const [dx, dy] of arms) {
    line(cx, cy, cx + dx, cy + dy, INK);
    circle(cx + dx, cy + dy, 13, INK, false);
    line(cx + dx - 16, cy + dy, cx + dx + 16, cy + dy, INK);
  }
  rect(cx - 26, cy - 12, 52, 24, INK);
  circle(cx, cy, 6, RED, true);
  rect(cx - 8, cy + 12, 16, 8, INK);
}

// ------------------------------------------------------------------- layout

function doubleRule(y: number): void {
  hline(36, y, 952, 3, INK);
  hline(36, y + 6, 952, 1, INK);
}

function drawPage(): void {
  fill(PAPER);

  // Masthead.
  drawTextCentered("THE WORLD IN ONE DAY", 512, 28, 6, INK);
  doubleRule(82);

  // Dateline.
  drawTextCentered("FRIDAY 20 NOVEMBER 2026", 512, 100, 2, INK);
  drawText("ONE DAY - ONE IMAGE", 36, 102, 1, GREY);
  drawText("PRICE: FREE", 1024 - 36 - textWidth("PRICE: FREE", 1), 102, 1, GREY);
  hline(36, 122, 952, 1, INK);

  // Lead headline.
  drawTextCentered("AI FEARS SEND ASIAN", 512, 136, 4, INK);
  drawTextCentered("MARKETS PLUNGING", 512, 170, 4, INK);

  // Lead subhead.
  drawTextCentered(
    "NIKKEI -5.1% \u2022 SOFTBANK -14.5% \u2022 TAIWAN -6.2% \u2022 KOSPI -5.2%",
    512,
    212,
    2,
    RED,
  );

  // Lead body.
  drawParagraph(
    "TOKYO - ASIAN SHARES TUMBLED ON FRIDAY AS FEARS OVER THE COST OF THE ARTIFICIAL INTELLIGENCE BOOM SPREAD FROM WALL STREET. JAPAN'S NIKKEI CLOSED DOWN 5.1 PERCENT, SOUTH KOREA'S KOSPI FELL 5.2 PERCENT AND TAIWAN'S TAIEX LOST 6.2 PERCENT. SOFTBANK, A MAJOR BACKER OF OPENAI, FELL 14.5 PERCENT. THE ROUT FOLLOWED A RECORD 81.3 BILLION DOLLAR DEBUT FOR ANTHROPIC, WHOSE SHARES CLOSED 17 PERCENT ABOVE THEIR 83 DOLLAR OFFER PRICE.",
    36,
    240,
    952,
    2,
    17,
    INK,
  );

  // Chart panel.
  drawBarChart(36, 352, 952, 128);

  hline(36, 496, 952, 2, INK);

  // Middle row: two stories.
  vline(512, 512, 232, 1, GREY);

  // Story 2 — Europe youth protests.
  drawText("EUROPE", 36, 514, 1, RED);
  drawText("YOUTH TAKE TO THE", 36, 534, 3, INK);
  drawText("STREETS IN 25 NATIONS", 36, 566, 3, INK);
  hline(36, 600, 460, 1, INK);
  drawCrowd(36, 612, 460, 52);
  drawParagraph(
    "YOUNG PEOPLE AND UNIONS STAGED COORDINATED PROTESTS IN MORE THAN 25 EUROPEAN COUNTRIES ON FRIDAY, AGAINST RISING LIVING COSTS, HOUSING PRESSURE AND MILITARISATION.",
    36,
    676,
    460,
    2,
    16,
    INK,
  );

  // Story 3 — UK drones for Ukraine.
  drawText("UKRAINE", 528, 514, 1, RED);
  drawText("BRITAIN TO SEND 1,000", 528, 534, 3, INK);
  drawText("DRONES TO KYIV", 528, 566, 3, INK);
  hline(528, 600, 460, 1, INK);
  drawDrone(528, 610, 460, 56);
  drawParagraph(
    "BRITAIN PLEDGED MORE THAN 1,000 LONG-RANGE DRONES FOR UKRAINE IN A 260 MILLION POUND PACKAGE, AS ALLIES IN BERLIN SAID EUROPE WAS READY TO TALK TO RUSSIA ABOUT ENDING THE WAR.",
    528,
    676,
    460,
    2,
    16,
    INK,
  );

  hline(36, 760, 952, 2, INK);

  // Bottom row: two stories.
  vline(512, 776, 160, 1, GREY);

  // Story 4 — German metalworkers strike.
  drawText("GERMANY", 36, 778, 1, RED);
  drawText("METALWORKERS STRIKE", 36, 798, 3, INK);
  drawText("FIRST TIME IN 8 YEARS", 36, 828, 3, INK);
  drawParagraph(
    "GERMANY'S IG METALL UNION CALLED A 24-HOUR WARNING STRIKE ACROSS SHIPYARDS, SUPPLIERS AND CARMAKERS, ITS FIRST IN EIGHT YEARS. ITALY HELD A NATIONWIDE STRIKE THE SAME DAY.",
    36,
    862,
    460,
    2,
    16,
    INK,
  );

  // Story 5 — GTA VI sales.
  drawText("CULTURE", 528, 778, 1, RED);
  drawText("GTA VI TOPS $2.3BN", 528, 798, 3, INK);
  drawText("IN LAUNCH SALES", 528, 828, 3, INK);
  drawParagraph(
    "GRAND THEFT AUTO VI HAS PASSED 2.3 BILLION DOLLARS IN LAUNCH SALES, THE BIGGEST OPENING IN THE SERIES' HISTORY, AS MILLIONS PLAYED - AND MILLIONS MORE WATCHED OTHERS PLAY.",
    528,
    862,
    460,
    2,
    16,
    INK,
  );

  // Also today strip.
  rect(36, 950, 952, 50, INK);
  drawText("ALSO TODAY:", 48, 960, 2, WHITE);
  drawText(
    "TRUMP PARDONS PETE ROSE \u2022 US LOSES MEASLES-FREE STATUS \u2022 BEPICOLOMBO REACHES MERCURY",
    48,
    980,
    1,
    WHITE,
  );
  drawText(
    "VATICAN TREE RAISED \u2022 IRAN TANKER CONVOY TESTS US BLOCKADE \u2022 UK AND EU AGREE YOUTH MOBILITY DEAL",
    48,
    990,
    1,
    WHITE,
  );

  // Footer sources.
  drawTextCentered(
    "SOURCES: MORNINGSTAR \u2022 BBC \u2022 REUTERS \u2022 EUROPA EXPRESS - ALL EVENTS FRIDAY 20 NOVEMBER 2026",
    512,
    1010,
    1,
    GREY,
  );
}

// --------------------------------------------------------------- PNG encode

const CRC_TABLE: number[] = (() => {
  const table: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 8 + data.length);
  return out;
}

function encodePng(): Buffer {
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0; // filter: none
    raw.set(px.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------- main

function main(): void {
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  fs.mkdirSync(outDir, { recursive: true });
  drawPage();
  const png = encodePng();
  const outPath = path.join(outDir, "entry.png");
  fs.writeFileSync(outPath, png);
  console.log(`wrote ${outPath} (${png.length} bytes)`);
}

main();
