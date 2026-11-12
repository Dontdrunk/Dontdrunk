import { mkdir, writeFile } from "node:fs/promises";

const USER = "Dontdrunk";
const CELL = 13, GAP = 4, COLW = CELL + GAP, ROWH = CELL + GAP, PADX = 44, TOP = 46;
const C = { e: "#1b1b16", a: "#6b5c08", b: "#a68c00", c: "#d1b100", d: "#ffd400", hot: "#e03b2f" };

const res = await fetch("https://github-contributions-api.jogruber.de/v4/" + USER + "?y=last");
if (!res.ok) throw new Error("api " + res.status);
const data = await res.json();
const days = data.contributions || [];
const total = (data.total && data.total.lastYear) || days.reduce((s, d) => s + d.count, 0);
const counts = days.map(d => d.count);
const maxCount = Math.max.apply(null, counts.concat([0]));
const peakDays = counts.filter(c => c === maxCount && c > 0).length;

const first = new Date(days[0].date + "T00:00:00Z");
const firstDow = first.getUTCDay();
const cols = Math.ceil((days.length + firstDow) / 7);

function fill(c) {
  if (c === 0) return C.e;
  if (c === maxCount && maxCount >= 4 && peakDays <= 6) return C.hot;
  if (c >= 10) return C.d;
  if (c >= 6) return C.c;
  if (c >= 3) return C.b;
  return C.a;
}

const W = PADX + cols * COLW + 10;
const H = TOP + 7 * ROWH + 6;
let out = [];
out.push('<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + " " + H + '" role="img">');
out.push('<text x="0" y="16" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="13" fill="#8a8a80">最近一年 ' + total + ' 次提交</text>');
const lx = W - 150;
out.push('<text x="' + lx + '" y="16" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="11" fill="#8a8a80">少</text>');
["e","a","b","c","d"].forEach((k, i) => {
  out.push('<rect x="' + (lx + 22 + i * 17) + '" y="6" width="13" height="13" rx="2" fill="' + C[k] + '"/>');
});
out.push('<text x="' + (lx + 22 + 5 * 17 + 4) + '" y="16" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="11" fill="#8a8a80">多</text>');

const MON = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];
let lastMonth = -1;
days.forEach((d, i) => {
  const col = Math.floor((i + firstDow) / 7);
  const row = (i + firstDow) % 7;
  const dt = new Date(d.date + "T00:00:00Z");
  const m = dt.getUTCMonth();
  if (m !== lastMonth) {
    lastMonth = m;
    out.push('<text x="' + (PADX + col * COLW) + '" y="' + (TOP - 8) + '" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="10" fill="#6b6b60">' + MON[m] + "</text>");
  }
  out.push('<rect x="' + (PADX + col * COLW) + '" y="' + (TOP + row * ROWH) + '" width="13" height="13" rx="2" fill="' + fill(d.count) + '"/>');
});
out.push("</svg>");

await mkdir("dist", { recursive: true });
await writeFile("dist/contrib.svg", out.join("\n"), "utf8");
console.log("days", days.length, "total", total, "max", maxCount);
