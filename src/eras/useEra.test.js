/**
 * @jest-environment jsdom
 */
import { render, act } from "@testing-library/react";
import useEra from "./useEra";

function Probe() {
  const [era, setEra] = useEra();
  return (
    <button data-era-value={era} onClick={() => setEra("y2001")}>
      era
    </button>
  );
}

describe("useEra", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
    document.documentElement.removeAttribute("data-era");
  });

  it("defaults to the present and sets no data-era attribute", () => {
    const { container } = render(<Probe />);
    expect(container.firstChild).toHaveAttribute("data-era-value", "present");
    expect(document.documentElement.hasAttribute("data-era")).toBe(false);
  });

  it("reflects a chosen era onto <html> and the URL", () => {
    const { container } = render(<Probe />);

    act(() => container.firstChild.click());

    expect(container.firstChild).toHaveAttribute("data-era-value", "y2001");
    expect(document.documentElement.getAttribute("data-era")).toBe("y2001");
    expect(window.location.search).toBe("?era=y2001");
  });

  it("initializes from an ?era= param in the URL", () => {
    window.history.replaceState(null, "", "/?era=y2014");
    const { container } = render(<Probe />);
    expect(container.firstChild).toHaveAttribute("data-era-value", "y2014");
    expect(document.documentElement.getAttribute("data-era")).toBe("y2014");
  });

  it("ignores an unknown ?era= value", () => {
    window.history.replaceState(null, "", "/?era=disco");
    const { container } = render(<Probe />);
    expect(container.firstChild).toHaveAttribute("data-era-value", "present");
  });

  it("preserves other query params (e.g. search) when setting the era", () => {
    window.history.replaceState(null, "", "/?q=prophet");
    const { container } = render(<Probe />);

    act(() => container.firstChild.click());

    const params = new URLSearchParams(window.location.search);
    expect(params.get("q")).toBe("prophet");
    expect(params.get("era")).toBe("y2001");
  });
});
