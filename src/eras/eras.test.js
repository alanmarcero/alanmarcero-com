import { ERAS, PAST_ERAS, DEFAULT_ERA, isEra, getEra } from "./eras";

describe("eras data", () => {
  it("starts with the present as the default era", () => {
    expect(DEFAULT_ERA).toBe("present");
    expect(ERAS[0].id).toBe("present");
  });

  it("has unique era ids", () => {
    const ids = ERAS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("excludes the present from the travelable past eras", () => {
    expect(PAST_ERAS.some((e) => e.id === "present")).toBe(false);
    expect(PAST_ERAS).toHaveLength(ERAS.length - 1);
  });

  it("validates era ids", () => {
    expect(isEra("y2001")).toBe(true);
    expect(isEra("present")).toBe(true);
    expect(isEra("y1999")).toBe(false);
    expect(isEra(null)).toBe(false);
  });

  it("looks up an era by id, or null when unknown", () => {
    expect(getEra("y2007").label).toBe("Web 1.0");
    expect(getEra("nope")).toBeNull();
  });
});
