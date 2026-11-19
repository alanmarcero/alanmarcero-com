/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import App from "./App";

describe("Home", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("is the patch banks page", () => {
    render(<App />);

    expect(screen.getByRole("heading", { level: 1, name: "Patch Banks" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search patch banks...")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Compatible Instruments" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Patches" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Plugins" })).toHaveAttribute("href", "/plugins");
    expect(screen.queryByRole("link", { name: /arcade/i })).not.toBeInTheDocument();
  });

  it("renders skip-to-content", () => {
    const { container } = render(<App />);
    const link = container.querySelector("a.skip-to-content");
    expect(link).toHaveAttribute("href", "#main-content");
  });
});
