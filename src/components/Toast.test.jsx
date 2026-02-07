/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import Toast from "./Toast";

describe("Toast", () => {
  it("renders the message text", () => {
    render(<Toast message="Download started" visible={true} />);

    expect(screen.getByText("Download started")).toBeInTheDocument();
  });

  it("applies toast--visible class when visible is true", () => {
    render(<Toast message="Download started" visible={true} />);

    const toast = screen.getByRole("status");
    expect(toast).toHaveClass("toast--visible");
  });

  it("does not apply toast--visible class when visible is false", () => {
    render(<Toast message="Download started" visible={false} />);

    const toast = screen.getByRole("status");
    expect(toast).not.toHaveClass("toast--visible");
  });

  it("has role=status for accessibility", () => {
    render(<Toast message="Test" visible={false} />);

    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
