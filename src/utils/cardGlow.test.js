/**
 * @jest-environment jsdom
 */
import { cardGlowHandlers } from "./cardGlow";

describe("cardGlowHandlers", () => {
  it("sets --mouse-x and --mouse-y on mousemove", () => {
    const el = document.createElement("div");
    el.getBoundingClientRect = () => ({ left: 10, top: 20 });

    cardGlowHandlers.onMouseMove({
      clientX: 110,
      clientY: 70,
      currentTarget: el,
    });

    expect(el.style.getPropertyValue("--mouse-x")).toBe("100px");
    expect(el.style.getPropertyValue("--mouse-y")).toBe("50px");
  });

  it("removes --mouse-x and --mouse-y on mouseleave", () => {
    const el = document.createElement("div");
    el.style.setProperty("--mouse-x", "100px");
    el.style.setProperty("--mouse-y", "50px");

    cardGlowHandlers.onMouseLeave({ currentTarget: el });

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
