import { bankThumb } from "./bankThumbs";

describe("bankThumb", () => {
  it("maps known synths to their archived thumbnails", () => {
    expect(bankThumb("Sequential Prophet 08 and Rev2")).toBe("/eras/img/p08.jpg");
    expect(bankThumb("Nord Lead 3 and Nord Rack 3")).toBe("/eras/img/nl3.jpg");
    expect(bankThumb("Access Virus TI and TI2, OsTIrus, Adam Szabo Viper")).toBe(
      "/eras/img/virusti.jpg"
    );
    expect(bankThumb("Roland SH-01A")).toBe("/eras/img/sh01a_small.jpg");
    expect(bankThumb("Alesis A6 Andromeda")).toBe("/eras/img/andysmall.jpg");
    expect(bankThumb("Roland JP-8000, JP-8080, JE-8086, and Airwave")).toBe(
      "/eras/img/jp80x0_small.jpg"
    );
    expect(bankThumb("Moog Slim Phatty and Little Phatty")).toBe("/eras/img/moog_small.jpg");
    expect(bankThumb("Nord Lead 2X, Nord Lead 2, DiscoDSP Discovery Pro")).toBe(
      "/eras/img/nl2x_small.jpg"
    );
  });

  it("returns null when the archive has no image for the bank", () => {
    expect(bankThumb("Waves CODEX")).toBeNull();
    expect(bankThumb("Audio Demo MIDIs")).toBeNull();
    expect(bankThumb("Roland JP-08")).toBeNull();
    expect(bankThumb("")).toBeNull();
    expect(bankThumb(undefined)).toBeNull();
  });
});
