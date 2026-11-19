/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import App from "./App";
import { HOME_LINKS } from "./site/pages";

describe("Home", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("keeps the intro short and links into the other pages", () => {
    render(<App />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Alan Marcero");
    expect(screen.getByRole("heading", { name: "Sections" })).toBeInTheDocument();

    HOME_LINKS.forEach((item) => {
      const links = screen.getAllByRole("link", { name: item.label, exact: false });
      expect(links.length).toBeGreaterThan(0);
      links.forEach((link) => expect(link).toHaveAttribute("href", item.href));
    });

    expect(screen.queryByRole("link", { name: /arcade/i })).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Search/)).not.toBeInTheDocument();
  });

  it("renders skip-to-content and the scope above the footer", () => {
    const { container } = render(<App />);

    const link = container.querySelector("a.skip-to-content");
    expect(link).toHaveAttribute("href", "#main-content");

    const scope = container.querySelector(".page-scope");
    const footer = container.querySelector("footer");
    expect(scope).toBeTruthy();
    expect(scope.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
