import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(cleanup);

// Radix announces toasts after two animation frames.
globalThis.requestAnimationFrame = (callback) =>
  setTimeout(() => callback(performance.now()), 0) as unknown as number;
globalThis.cancelAnimationFrame = (handle) => clearTimeout(handle);
