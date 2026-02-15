import "@testing-library/jest-dom";

const formatConsoleMsg = (args: unknown[]) =>
  args.map((a) => (typeof a === "string" ? a : String(a))).join(" ");
const shouldSuppress = (msg: string, patterns: string[]) =>
  patterns.some((pattern) => msg.includes(pattern));

const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  const msg = formatConsoleMsg(args);
  if (
    shouldSuppress(msg, [
      "React Router Future Flag",
      "v7_startTransition",
      "v7_relativeSplatPath",
    ])
  )
    return;
  originalWarn.apply(console, args);
};

const originalLog = console.log;
console.log = (...args: unknown[]) => {
  const msg = formatConsoleMsg(args);
  if (shouldSuppress(msg, ["locize", "i18next"])) return;
  originalLog.apply(console, args);
};
const originalInfo = console.info;
console.info = (...args: unknown[]) => {
  const msg = formatConsoleMsg(args);
  if (shouldSuppress(msg, ["locize", "i18next"])) return;
  originalInfo.apply(console, args);
};

const originalError = console.error;
console.error = (...args: unknown[]) => {
  const msg = formatConsoleMsg(args);
  if (
    shouldSuppress(msg, [
      "404 Error: User attempted to access non-existent route",
    ])
  )
    return;
  originalError.apply(console, args);
};

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
