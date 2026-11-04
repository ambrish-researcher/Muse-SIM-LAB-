import { tiledMultiply } from "./advanced";
self.onmessage = (
  event: MessageEvent<{ a: number[][]; b: number[][]; tile: number }>,
) => {
  const { a, b, tile } = event.data;
  if (![2, 4].includes(a.length) || b.length !== a.length) return;
  const start = performance.now();
  const result = tiledMultiply(a, b, tile);
  self.postMessage({ product: result.product, ms: performance.now() - start });
};
