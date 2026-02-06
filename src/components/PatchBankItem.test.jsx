/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import PatchBankItem from "./PatchBankItem";

describe("PatchBankItem", () => {
  const mockBank = {
    name: "Test Synth Patches",
    description: "128 awesome patches",
    audioDemo: ["video1", "video2"],
    downloadLink: "/banks/test.zip",
  };

  it("renders the bank name", () => {
    render(<PatchBankItem bank={mockBank} />);

    expect(screen.getByText("Test Synth Patches")).toBeInTheDocument();
  });

  it("renders the description", () => {
    render(<PatchBankItem bank={mockBank} />);

    expect(screen.getByText("128 awesome patches")).toBeInTheDocument();
  });

  it("renders a download button with correct link", () => {
    render(<PatchBankItem bank={mockBank} />);

    const downloadBtn = screen.getByText("Download");
    expect(downloadBtn).toBeInTheDocument();
    expect(downloadBtn).toHaveAttribute("href", "/banks/test.zip");
  });

  it("renders YouTube embeds for each audioDemo", () => {
    render(<PatchBankItem bank={mockBank} />);

    const iframes = document.querySelectorAll("iframe");
    expect(iframes).toHaveLength(2);
    expect(iframes[0]).toHaveAttribute("src", "https://www.youtube.com/embed/video1");
    expect(iframes[1]).toHaveAttribute("src", "https://www.youtube.com/embed/video2");
  });

  it("renders no iframes when audioDemo is empty array", () => {
    const bankEmptyDemo = { ...mockBank, audioDemo: [] };
    render(<PatchBankItem bank={bankEmptyDemo} />);

    const iframes = document.querySelectorAll("iframe");
    expect(iframes).toHaveLength(0);
  });

  it("skips falsy videoIds in audioDemo array", () => {
    const bankWithFalsyId = { ...mockBank, audioDemo: ["valid", "", null] };
    render(<PatchBankItem bank={bankWithFalsyId} />);

    const iframes = document.querySelectorAll("iframe");
    expect(iframes).toHaveLength(1);
  });

  it("download button has btn-primary class", () => {
    render(<PatchBankItem bank={mockBank} />);

    const downloadBtn = screen.getByText("Download");
    expect(downloadBtn).toHaveClass("btn-primary");
  });

  it("renders with store-item container class", () => {
    const { container } = render(<PatchBankItem bank={mockBank} />);

    expect(container.querySelector(".store-item")).toBeInTheDocument();
  });

  it("applies style prop to container", () => {
    const { container } = render(
      <PatchBankItem bank={mockBank} style={{ '--card-index': 2 }} />
    );

    const card = container.querySelector(".store-item");
    expect(card.style.getPropertyValue("--card-index")).toBe("2");
  });

  it("renders name in an h3 element", () => {
    const { container } = render(<PatchBankItem bank={mockBank} />);

    const heading = container.querySelector("h3");
    expect(heading).toHaveTextContent("Test Synth Patches");
  });

  it("renders description in a paragraph element", () => {
    const { container } = render(<PatchBankItem bank={mockBank} />);

    const paragraphs = container.querySelectorAll("p");
    const descParagraph = Array.from(paragraphs).find(
      (p) => p.textContent === "128 awesome patches"
    );
    expect(descParagraph).toBeInTheDocument();
  });
});
