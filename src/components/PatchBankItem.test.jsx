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
});
