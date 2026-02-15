import "@testing-library/jest-dom";

const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  const msg = typeof args[0] === "string" ? args[0] : String(args[0]);
  if (msg.includes("React Router Future Flag") || msg.includes("v7_startTransition") || msg.includes("v7_relativeSplatPath")) return;
  originalWarn.apply(console, args);
};

const originalLog = console.log;
console.log = (...args: unknown[]) => {
  const msg = args.map((a) => (typeof a === "string" ? a : String(a))).join(" ");
  if (msg.includes("locize") || msg.includes("i18next")) return;
  originalLog.apply(console, args);
};
const originalInfo = console.info;
console.info = (...args: unknown[]) => {
  const msg = args.map((a) => (typeof a === "string" ? a : String(a))).join(" ");
  if (msg.includes("locize") || msg.includes("i18next")) return;
  originalInfo.apply(console, args);
};

const originalError = console.error;
console.error = (...args: unknown[]) => {
  const msg = typeof args[0] === "string" ? args[0] : String(args[0]);
  if (msg.includes("404 Error: User attempted to access non-existent route")) return;
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
