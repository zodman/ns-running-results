import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
});

// Provide lightweight canvas stub so background OG card rendering never throws in jsdom
if (typeof HTMLCanvasElement !== "undefined") {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    createLinearGradient: () => ({ addColorStop: () => {} }),
    createRadialGradient: () => ({ addColorStop: () => {} }),
    fillRect: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    arcTo: () => {},
    arc: () => {},
    closePath: () => {},
    fill: () => {},
    stroke: () => {},
    clip: () => {},
    save: () => {},
    restore: () => {},
    drawImage: () => {},
    fillText: () => {},
    measureText: (t) => ({ width: String(t || "").length * 10 })
  }));
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => "data:image/jpeg;base64,ZmFrZQ==");
  HTMLCanvasElement.prototype.toBlob = vi.fn((cb) => cb(new Blob(["fake"], { type: "image/jpeg" })));
}
