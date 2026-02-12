/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
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

  it("applies style prop to container", () => {
    const { container } = render(
      <PatchBankItem bank={mockBank} style={{ '--card-index': 2 }} />
    );

    const card = container.querySelector(".store-item");
    expect(card.style.getPropertyValue("--card-index")).toBe("2");
  });

  it("calls onDownload when download button is clicked", () => {
    const onDownload = jest.fn();
    render(<PatchBankItem bank={mockBank} onDownload={onDownload} />);

    fireEvent.click(screen.getByText("Download"));

    expect(onDownload).toHaveBeenCalledTimes(1);
  });

  it("has mouse event handlers for card glow", () => {
    jest.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => { cb(0); return 1; });
    const { container } = render(<PatchBankItem bank={mockBank} />);

    const card = container.querySelector(".store-item");
    card.getBoundingClientRect = () => ({ left: 0, top: 0 });

    fireEvent.mouseMove(card, { clientX: 50, clientY: 30 });
    expect(card.style.getPropertyValue("--mouse-x")).toBe("50px");
    expect(card.style.getPropertyValue("--mouse-y")).toBe("30px");

    fireEvent.mouseLeave(card);
    expect(card.style.getPropertyValue("--mouse-x")).toBe("");
    window.requestAnimationFrame.mockRestore();
  });
});
