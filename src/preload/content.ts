(function() {
  const originalGetContext = (HTMLCanvasElement.prototype as any).getContext;
  (HTMLCanvasElement.prototype as any).getContext = function(...args: any[]) {
    const ctx = originalGetContext.apply(this, args);
    if (args[0] === '2d' && ctx) {
      const origGetImageData = (ctx as any).getImageData;
      (ctx as any).getImageData = function(...gArgs: any[]) {
        const data = origGetImageData.apply(this, gArgs);
        for (let i = 0; i < data.data.length; i += 4) {
          data.data[i] = data.data[i] ^ (Math.random() < 0.5 ? 1 : 0);
        }
        return data;
      };
    }
    return ctx;
  };

  try {
    Object.defineProperty(navigator, 'plugins', { get: () => [] as any });
    Object.defineProperty(navigator, 'mimeTypes', { get: () => [] as any });
  } catch(e) {}

  try {
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 4 });
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 4 });
  } catch(e) {}
})();
