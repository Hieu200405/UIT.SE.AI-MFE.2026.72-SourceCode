import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chartGeometry, niceMax, trendSummary } from '../src/index.ts';

test('niceMax: ≤ 8 → số chẵn (tối thiểu 4); lớn hơn → bội của 4', () => {
  assert.deepEqual([0, 1, 4, 5, 7, 8, 9, 13, 20].map(niceMax), [4, 4, 4, 6, 8, 8, 12, 16, 20]);
});
test('dữ liệu wireframe [7,6,6,4,4,3,2,1]: trục 0–8 bước 2; lỗi giảm → điểm đi xuống (y tăng)', () => {
  const g = chartGeometry([7, 6, 6, 4, 4, 3, 2, 1]);
  assert.equal(g.max, 8); assert.deepEqual(g.yTicks.map((t) => t.label), ['0', '2', '4', '6', '8']);
  assert.equal(g.points.length, 8);
  for (let i = 1; i < g.points.length; i++) { assert.ok(g.points[i].y >= g.points[i - 1].y); assert.ok(g.points[i].x > g.points[i - 1].x); }
  assert.ok(g.linePath.startsWith('M') && g.areaPath.endsWith('Z'));
});
test('điểm nằm trong khung vẽ; giá trị 0 nằm trên trục, giá trị max nằm trên cùng', () => {
  const g = chartGeometry([0, 8], 480, 220);
  assert.equal(g.points[0].y, 220 - 28);   // đáy vùng vẽ
  assert.equal(g.points[1].y, 12);         // đỉnh vùng vẽ
  assert.ok(g.points.every((p) => p.x >= 32 && p.x <= 480 - 12));
});
test('một điểm → ở giữa; rỗng → không vẽ gì', () => {
  const one = chartGeometry([3]); assert.equal(one.points[0].x, 32 + (480 - 32 - 12) / 2);
  const none = chartGeometry([]); assert.deepEqual(none.points, []); assert.equal(none.areaPath, '');
});
test('trendSummary', () => {
  assert.equal(trendSummary([7, 3, 1]), 'Down from 7 to 1 mistakes over 3 sessions.');
  assert.equal(trendSummary([1, 5]), 'Up from 1 to 5 mistakes over 2 sessions.');
  assert.equal(trendSummary([2, 2]), 'Steady at 2 mistakes over 2 sessions.');
  assert.equal(trendSummary([]), '');
});
