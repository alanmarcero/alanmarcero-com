import { createSearchFilter } from "./search";

const ITEMS = [
  { name: "Prophet 08", description: "Trance leads" },
  { name: "Nord Lead 3", description: "FM pads" },
  { name: "No description" },
];

describe("createSearchFilter", () => {
  it("matches everything for an empty query", () => {
    expect(ITEMS.filter(createSearchFilter("", "name"))).toHaveLength(3);
  });

  it("matches case-insensitively", () => {
    const matches = ITEMS.filter(createSearchFilter("PROPHET", "name"));

    expect(matches.map((item) => item.name)).toEqual(["Prophet 08"]);
  });

  it("searches every named field", () => {
    const matches = ITEMS.filter(createSearchFilter("fm", "name", "description"));

    expect(matches.map((item) => item.name)).toEqual(["Nord Lead 3"]);
  });

  it("treats a missing field as empty text", () => {
    const matches = ITEMS.filter(createSearchFilter("description", "name", "description"));

    expect(matches.map((item) => item.name)).toEqual(["No description"]);
  });
});
