/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, act } from "@testing-library/react";
import BackToTop from "./BackToTop";

describe("BackToTop", () => {
  beforeEach(() => {
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
    window.scrollTo = jest.fn();
  });

  it("is not visible when scroll is below threshold", () => {
    render(<BackToTop />);

    const button = screen.getByLabelText("Back to top");
    expect(button).not.toHaveClass("back-to-top--visible");
  });

  it("becomes visible when scroll exceeds threshold", () => {
    render(<BackToTop />);

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 500, writable: true });
      fireEvent.scroll(window);
    });

    const button = screen.getByLabelText("Back to top");
    expect(button).toHaveClass("back-to-top--visible");
  });

  it("calls scrollTo on click", () => {
    render(<BackToTop />);

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 500, writable: true });
      fireEvent.scroll(window);
    });

    const button = screen.getByLabelText("Back to top");
    fireEvent.click(button);

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it("hides when scrolling back below threshold", () => {
    render(<BackToTop />);

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 500, writable: true });
      fireEvent.scroll(window);
    });

    expect(screen.getByLabelText("Back to top")).toHaveClass("back-to-top--visible");

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 100, writable: true });
      fireEvent.scroll(window);
    });

    expect(screen.getByLabelText("Back to top")).not.toHaveClass("back-to-top--visible");
  });
});
