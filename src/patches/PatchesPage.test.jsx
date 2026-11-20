/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import PatchesPage from "./PatchesPage";
import { TOAST_DISMISS_MS } from "../config";

jest.mock("../data/patchBanks", () => ({
  patchBanks: [
    {
      name: "Test Synth",
      description: "Test patches",
      audioDemo: ["testVideo"],
      downloadLink: "/banks/test.zip",
      count: 12,
    },
  ],
}));

describe("PatchesPage", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("renders patch banks from data", () => {
    render(<PatchesPage />);
    expect(screen.getByRole("heading", { name: "Test Synth" })).toBeInTheDocument();
  });

  it("does not show the patch-count header line", () => {
    render(<PatchesPage />);
    expect(screen.queryByText(/patches across/)).not.toBeInTheDocument();
    expect(screen.queryByText(/free to download/)).not.toBeInTheDocument();
  });

  it("filters by name and description, then clears", () => {
    render(<PatchesPage />);
    const search = screen.getByPlaceholderText("Search patch banks...");

    const bank = () => screen.queryByRole("heading", { name: "Test Synth" });

    fireEvent.change(search, { target: { value: "TEST SYNTH" } });
    expect(bank()).toBeInTheDocument();

    fireEvent.change(search, { target: { value: "Test patches" } });
    expect(bank()).toBeInTheDocument();

    fireEvent.change(search, { target: { value: "missing" } });
    expect(bank()).not.toBeInTheDocument();
    expect(screen.getByText(/No signal for/)).toBeInTheDocument();

    fireEvent.change(search, { target: { value: "" } });
    expect(bank()).toBeInTheDocument();
  });

  it("shows a toast when download is clicked and dismisses it", () => {
    jest.useFakeTimers();
    render(<PatchesPage />);

    fireEvent.click(screen.getByText("Download"));
    expect(screen.getByText("Downloading now...")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(TOAST_DISMISS_MS);
    });
    expect(screen.queryByText("Downloading now...")).not.toBeInTheDocument();
    jest.useRealTimers();
  });

  it("syncs ?q= and restores it from the URL", async () => {
    render(<PatchesPage />);
    const search = screen.getByPlaceholderText("Search patch banks...");

    fireEvent.change(search, { target: { value: "prophet" } });
    await waitFor(() => expect(window.location.search).toBe("?q=prophet"));

    fireEvent.change(search, { target: { value: "" } });
    await waitFor(() => expect(window.location.search).toBe(""));
  });

  it("hydrates ?q= and clears it with Escape", () => {
    window.history.replaceState(null, "", "/?q=prophet");
    render(<PatchesPage />);

    const search = screen.getByLabelText("Search patch banks");
    expect(search).toHaveValue("prophet");

    fireEvent.keyDown(search, { key: "Escape" });
    expect(search).toHaveValue("");
    expect(document.activeElement).toBe(search);
  });

  it("passes card-index to the bank card", () => {
    const { container } = render(<PatchesPage />);
    const card = container.querySelector(".module");
    expect(card.style.getPropertyValue("--card-index")).toBe("0");
  });
});
