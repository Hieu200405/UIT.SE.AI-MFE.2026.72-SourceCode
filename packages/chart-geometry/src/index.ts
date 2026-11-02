export interface Pad { l: number; r: number; t: number; b: number }
export interface ChartGeometry {
  max: number; points: Array<{ x: number; y: number; value: number }>;
  linePath: string; areaPath: string; yTicks: Array<{ y: number; label: string }>;
}

/** Trục Y "đẹp": ≤ 8 → số chẵn (tối thiểu 4, bước 2 như wireframe 0–8); lớn hơn → bội của 4 (bước = max/4). */
export function niceMax(m: number): number { return m <= 8 ? Math.max(4, Math.ceil(m / 2) * 2) : Math.ceil(m / 4) * 4; }

export function chartGeometry(values: number[], w = 480, h = 220, pad: Pad = { l: 32, r: 12, t: 12, b: 28 }): ChartGeometry {
  const max = niceMax(Math.max(0, ...values));
  const innerW = w - pad.l - pad.r, innerH = h - pad.t - pad.b, base = pad.t + innerH;
  const yOf = (v: number) => pad.t + (1 - v / max) * innerH;
  const points = values.map((v, i) => ({ x: values.length === 1 ? pad.l + innerW / 2 : pad.l + (i * innerW) / (values.length - 1), y: yOf(v), value: v }));
  const step = max <= 8 ? 2 : max / 4;
  const yTicks: ChartGeometry['yTicks'] = [];
  for (let v = 0; v <= max; v += step) yTicks.push({ y: yOf(v), label: String(v) });
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const area = points.length ? `${line} L${points[points.length - 1].x.toFixed(1)} ${base} L${points[0].x.toFixed(1)} ${base} Z` : '';
  return { max, points, linePath: line, areaPath: area, yTicks };
}

/** Câu tóm tắt xu hướng cho người đọc (và trình đọc màn hình). */
export function trendSummary(values: number[]): string {
  if (values.length < 2) return values.length ? 'Keep practicing to see your trend.' : '';
  const a = values[0], b = values[values.length - 1];
  if (b < a) return `Down from ${a} to ${b} mistakes over ${values.length} sessions.`;
  if (b > a) return `Up from ${a} to ${b} mistakes over ${values.length} sessions.`;
  return `Steady at ${b} mistakes over ${values.length} sessions.`;
}
