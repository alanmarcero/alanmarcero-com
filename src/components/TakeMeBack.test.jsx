/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import TakeMeBack from "./TakeMeBack";

describe("TakeMeBack", () => {
  it("shows the trigger and hides the menu initially", () => {
    render(<TakeMeBack onSelect={() => {}} />);
    expect(screen.getByRole("button", { name: "Take Me Back" })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("opens a year picker listing the past eras", () => {
    render(<TakeMeBack onSelect={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Take Me Back" }));

    expect(screen.getByRole("menu")).toBeInTheDocument();
    ["2001", "2007", "2014", "2020"].forEach((year) =>
      expect(screen.getByText(year)).toBeInTheDocument()
    );
  });

  it("reports the chosen era id and closes", () => {
    const onSelect = jest.fn();
    render(<TakeMeBack onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: "Take Me Back" }));
    fireEvent.click(screen.getByText("2001"));

    expect(onSelect).toHaveBeenCalledWith("y2001");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes on Escape", () => {
    render(<TakeMeBack onSelect={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Take Me Back" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
