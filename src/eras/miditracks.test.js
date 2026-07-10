import { TRACKS, DEFAULT_TRACK_ID, getTrack, trackToSequence, mtof } from "./miditracks";
import { createMidiPlayer } from "./midiPlayer";

describe("miditracks", () => {
  it("defaults to sandstorm and includes it in the list", () => {
    expect(DEFAULT_TRACK_ID).toBe("sandstorm");
    expect(TRACKS.some((t) => t.id === "sandstorm")).toBe(true);
  });

  it("offers the requested era bangers", () => {
    const ids = TRACKS.map((t) => t.id);
    ["sandstorm", "zombienation", "betteroffalone", "bloodispumping", "nokia", "furelise"].forEach(
      (id) => expect(ids).toContain(id)
    );
  });

  it("gives every track a name and a non-empty note list", () => {
    TRACKS.forEach((t) => {
      expect(t.name).toMatch(/\.mid$/);
      expect(t.notes.length).toBeGreaterThan(0);
      expect(t.bpm).toBeGreaterThan(0);
    });
  });

  it("converts MIDI numbers to frequencies (A4 = 440)", () => {
    expect(mtof(69)).toBeCloseTo(440);
    expect(mtof(81)).toBeCloseTo(880);
  });

  it("flattens a track into ordered, positive-duration events", () => {
    const { notes, loopSeconds } = trackToSequence(getTrack("sandstorm"));
    expect(notes.length).toBeGreaterThan(0);
    expect(loopSeconds).toBeGreaterThan(0);
    for (let i = 1; i < notes.length; i++) {
      expect(notes[i].at).toBeGreaterThanOrEqual(notes[i - 1].at);
    }
    notes.forEach((n) => {
      expect(n.freq).toBeGreaterThan(0);
      expect(n.dur).toBeGreaterThan(0);
    });
  });

  it("drops rests from the audible sequence but counts their time", () => {
    const track = { id: "t", name: "t.mid", bpm: 60, notes: [{ n: 69, b: 1 }, { n: null, b: 1 }, { n: 69, b: 1 }] };
    const { notes, loopSeconds } = trackToSequence(track);
    expect(notes).toHaveLength(2); // two audible notes
    expect(loopSeconds).toBeCloseTo(3); // three beats at 60bpm = 3s
    expect(notes[1].at).toBeCloseTo(2); // second note after the rest
  });

  it("falls back to the first track for an unknown id", () => {
    expect(getTrack("nope")).toBe(TRACKS[0]);
  });

  it("returns safe no-op player controls without Web Audio", () => {
    const player = createMidiPlayer();
    expect(player.playing).toBe(false);
    expect(() => {
      player.play(TRACKS[0]);
      player.stop();
    }).not.toThrow();
  });
});
