import { describe, expect, it } from "vitest";
import { consumeStep, pickFollowStep } from "./follow";

describe("follow", () => {
  it("stays still while the finger moves less than the threshold", () => {
    expect(pickFollowStep({ x: 0, y: 0 }, { x: 0.3, y: 0.3 })).toBeNull();
    expect(pickFollowStep({ x: 0, y: 0 }, { x: -0.5, y: 0 })).toBeNull();
  });

  it("follows the dominant horizontal axis", () => {
    expect(pickFollowStep({ x: 0, y: 0 }, { x: 1.4, y: 0.2 })).toEqual({ axis: "x", direction: "right" });
    expect(pickFollowStep({ x: 0, y: 0 }, { x: -1.4, y: 0.2 })).toEqual({ axis: "x", direction: "left" });
  });

  it("follows the dominant vertical axis with world y pointing up", () => {
    expect(pickFollowStep({ x: 0, y: 0 }, { x: 0.2, y: 1.4 })).toEqual({ axis: "y", direction: "up" });
    expect(pickFollowStep({ x: 0, y: 0 }, { x: 0.2, y: -1.4 })).toEqual({ axis: "y", direction: "down" });
  });

  it("keeps turning corners as the finger keeps dragging", () => {
    let consumed = { x: 0, y: 0 };
    const finger = { x: 1.4, y: 0.9 };

    const first = pickFollowStep(consumed, finger)!;
    expect(first).toEqual({ axis: "x", direction: "right" });
    consumed = consumeStep(consumed, first);

    const second = pickFollowStep(consumed, finger)!;
    expect(second).toEqual({ axis: "y", direction: "up" });
    consumed = consumeStep(consumed, second);

    expect(pickFollowStep(consumed, finger)).toBeNull();
  });

  it("consumes exactly one world unit without mutating the input", () => {
    const consumed = { x: 2, y: -3 };
    expect(consumeStep(consumed, { axis: "x", direction: "right" })).toEqual({ x: 3, y: -3 });
    expect(consumeStep(consumed, { axis: "x", direction: "left" })).toEqual({ x: 1, y: -3 });
    expect(consumeStep(consumed, { axis: "y", direction: "up" })).toEqual({ x: 2, y: -2 });
    expect(consumeStep(consumed, { axis: "y", direction: "down" })).toEqual({ x: 2, y: -4 });
    expect(consumed).toEqual({ x: 2, y: -3 });
  });
});
