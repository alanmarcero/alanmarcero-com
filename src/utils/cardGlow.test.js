/**
 * @jest-environment jsdom
 */
import { cardGlowHandlers } from "./cardGlow";

let rafCallbacks = [];
let rafId = 1;

beforeEach(() => {
  rafCallbacks = [];
  rafId = 1;
  jest.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    const id = rafId++;
    rafCallbacks.push({ id, cb });
    return id;
  });
  jest.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => {
    rafCallbacks = rafCallbacks.filter((entry) => entry.id !== id);
  });
});

afterEach(() => {
  window.requestAnimationFrame.mockRestore();
  window.cancelAnimationFrame.mockRestore();
});

function flushRAF() {
  const cbs = rafCallbacks.splice(0);
  cbs.forEach((entry) => entry.cb(performance.now()));
}

describe("cardGlowHandlers", () => {
  it("sets --mouse-x and --mouse-y on mousemove after RAF", () => {
    const el = document.createElement("div");
    el.getBoundingClientRect = () => ({ left: 10, top: 20 });

    cardGlowHandlers.onMouseMove({
      clientX: 110,
      clientY: 70,
      currentTarget: el,
    });

    expect(el.style.getPropertyValue("--mouse-x")).toBe("");
    flushRAF();
    expect(el.style.getPropertyValue("--mouse-x")).toBe("100px");
    expect(el.style.getPropertyValue("--mouse-y")).toBe("50px");
  });

  it("cancels pending RAF on subsequent mousemove", () => {
    const el = document.createElement("div");
    el.getBoundingClientRect = () => ({ left: 0, top: 0 });

    cardGlowHandlers.onMouseMove({ clientX: 10, clientY: 10, currentTarget: el });
    cardGlowHandlers.onMouseMove({ clientX: 20, clientY: 20, currentTarget: el });

    expect(window.cancelAnimationFrame).toHaveBeenCalled();
    flushRAF();
    expect(el.style.getPropertyValue("--mouse-x")).toBe("20px");
    expect(el.style.getPropertyValue("--mouse-y")).toBe("20px");
  });

  it("removes --mouse-x and --mouse-y on mouseleave", () => {
    const el = document.createElement("div");
    el.style.setProperty("--mouse-x", "100px");
    el.style.setProperty("--mouse-y", "50px");

    cardGlowHandlers.onMouseLeave({ currentTarget: el });

    expect(el.style.getPropertyValue("--mouse-x")).toBe("");
    expect(el.style.getPropertyValue("--mouse-y")).toBe("");
  });

  it("cancels pending RAF on mouseleave", () => {
    const el = document.createElement("div");
    el.getBoundingClientRect = () => ({ left: 0, top: 0 });

    cardGlowHandlers.onMouseMove({ clientX: 50, clientY: 50, currentTarget: el });
    cardGlowHandlers.onMouseLeave({ currentTarget: el });

    flushRAF();
    expect(el.style.getPropertyValue("--mouse-x")).toBe("");
    expect(el.style.getPropertyValue("--mouse-y")).toBe("");
  });

  it("handler references are stable across imports", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { cardGlowHandlers: handlers2 } = require("./cardGlow");
    expect(cardGlowHandlers.onMouseMove).toBe(handlers2.onMouseMove);
    expect(cardGlowHandlers.onMouseLeave).toBe(handlers2.onMouseLeave);
  });
});
