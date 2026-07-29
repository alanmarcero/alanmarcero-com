/**
 * @jest-environment jsdom
 */
import { writeQueryParam } from "./queryParam";

describe("writeQueryParam", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("adds the param when given a value", () => {
    writeQueryParam("q", "prophet");

    expect(window.location.search).toBe("?q=prophet");
  });

  it("replaces an existing value in place", () => {
    window.history.replaceState(null, "", "/?q=old&era=y2014");

    writeQueryParam("q", "new");

    expect(window.location.search).toBe("?q=new&era=y2014");
  });

  it("removes the param when the value is empty", () => {
    window.history.replaceState(null, "", "/?q=prophet");

    writeQueryParam("q", "");

    expect(window.location.search).toBe("");
  });

  it("removes the param when the value is null", () => {
    window.history.replaceState(null, "", "/?era=y2014");

    writeQueryParam("era", null);

    expect(window.location.search).toBe("");
  });

  it("leaves other params untouched", () => {
    window.history.replaceState(null, "", "/?era=y2001&q=drone");

    writeQueryParam("q", "");

    expect(window.location.search).toBe("?era=y2001");
  });

  it("preserves the pathname and hash", () => {
    window.history.replaceState(null, "", "/arcade.html#store");

    writeQueryParam("q", "saw");

    expect(window.location.pathname).toBe("/arcade.html");
    expect(window.location.hash).toBe("#store");
    expect(window.location.search).toBe("?q=saw");
  });

  it("drops the question mark entirely when the last param goes", () => {
    window.history.replaceState(null, "", "/?q=only#music");

    writeQueryParam("q", null);

    expect(window.location.href).toContain("/#music");
    expect(window.location.search).toBe("");
  });

  it("encodes values that need it", () => {
    writeQueryParam("q", "hi mom");

    expect(window.location.search).toBe("?q=hi+mom");
  });

  it("replaces rather than pushes, leaving history length unchanged", () => {
    const before = window.history.length;

    writeQueryParam("q", "prophet");

    expect(window.history.length).toBe(before);
  });
});
