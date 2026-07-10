/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import EraChrome from "./EraChrome";

describe("EraChrome", () => {
  it("renders nothing in the present", () => {
    const { container } = render(<EraChrome era="present" onSetEra={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the time-travel bar and a return-to-present control in a past era", () => {
    render(<EraChrome era="y2007" onSetEra={() => {}} />);
    expect(screen.getByRole("region", { name: /time travel/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /return to present/i })).toBeInTheDocument();
  });

  it("returns to the present when asked", () => {
    const onSetEra = jest.fn();
    render(<EraChrome era="y2007" onSetEra={onSetEra} />);
    fireEvent.click(screen.getByRole("button", { name: /return to present/i }));
    expect(onSetEra).toHaveBeenCalledWith("present");
  });

  it("adds the GeoCities gif chrome only in 2001", () => {
    const { container: c2007 } = render(<EraChrome era="y2007" onSetEra={() => {}} />);
    expect(c2007.querySelector(".gc-chrome")).toBeNull();

    const { container: c2001 } = render(<EraChrome era="y2001" onSetEra={() => {}} />);
    expect(c2001.querySelector(".gc-chrome")).not.toBeNull();
    // it was the gif era — lots of gifs
    expect(c2001.querySelectorAll("img[src^='/eras/gifs/']").length).toBeGreaterThan(25);
  });

  it("includes the auto-playing MIDI player defaulting to sandstorm", () => {
    const { container } = render(<EraChrome era="y2001" onSetEra={() => {}} />);
    expect(container.querySelector(".gc-midi__title")).toHaveTextContent("sandstorm.mid");
  });

  it("shows a fake era hit counter at the bottom", () => {
    render(<EraChrome era="y2001" onSetEra={() => {}} />);
    expect(screen.getByText(/visitor number/i)).toBeInTheDocument();
  });
});
