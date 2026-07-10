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

  it("renders YouTube facades for each audioDemo", () => {
    render(<PatchBankItem bank={mockBank} />);

    const thumbs = document.querySelectorAll("img.yt-facade__thumb");
    expect(thumbs).toHaveLength(2);
    expect(thumbs[0]).toHaveAttribute("src", "https://i.ytimg.com/vi/video1/hqdefault.jpg");
    expect(thumbs[1]).toHaveAttribute("src", "https://i.ytimg.com/vi/video2/hqdefault.jpg");
  });

  it("renders no embeds when audioDemo is empty array", () => {
    const bankEmptyDemo = { ...mockBank, audioDemo: [] };
    render(<PatchBankItem bank={bankEmptyDemo} />);

    expect(document.querySelectorAll(".yt-facade")).toHaveLength(0);
  });

  it("skips falsy videoIds in audioDemo array", () => {
    const bankWithFalsyId = { ...mockBank, audioDemo: ["valid", "", null] };
    render(<PatchBankItem bank={bankWithFalsyId} />);

    expect(document.querySelectorAll(".yt-facade")).toHaveLength(1);
  });

  it("applies style prop to container", () => {
    const { container } = render(
      <PatchBankItem bank={mockBank} style={{ '--card-index': 2 }} />
    );

    const card = container.querySelector(".module");
    expect(card.style.getPropertyValue("--card-index")).toBe("2");
  });

  it("calls onDownload when download button is clicked", () => {
    const onDownload = jest.fn();
    render(<PatchBankItem bank={mockBank} onDownload={onDownload} />);

    fireEvent.click(screen.getByText("Download"));

    expect(onDownload).toHaveBeenCalledTimes(1);
  });

  it("renders a patch-count badge when count is present", () => {
    render(<PatchBankItem bank={{ ...mockBank, count: 128 }} />);

    expect(screen.getByText("128 patches")).toBeInTheDocument();
  });

  it("omits the badge when count is absent", () => {
    const { container } = render(<PatchBankItem bank={mockBank} />);

    expect(container.querySelector(".module__badge")).not.toBeInTheDocument();
  });

  it("renders as a module panel with LED indicator", () => {
    const { container } = render(<PatchBankItem bank={mockBank} />);

    expect(container.querySelector("article.module")).toBeInTheDocument();
    expect(container.querySelector(".module__led")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector(".module__title")).toHaveTextContent("Test Synth Patches");
  });
});
