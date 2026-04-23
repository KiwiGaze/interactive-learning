import { describe, expect, it } from "vitest";
import { RingBuffer } from "../src/ring-buffer.js";

describe("RingBuffer", () => {
  it("keeps last N items, evicting oldest", () => {
    const rb = new RingBuffer<number>(3);
    for (const n of [1, 2, 3, 4]) rb.push(n);
    expect(rb.toArray()).toEqual([2, 3, 4]);
  });

  it("slices items after a given predicate match", () => {
    const rb = new RingBuffer<{ id: string }>(10);
    for (const id of ["a", "b", "c", "d"]) rb.push({ id });
    expect(rb.sliceAfter((x) => x.id === "b").map((x) => x.id)).toEqual(["c", "d"]);
  });

  it("returns empty slice when predicate never matches", () => {
    const rb = new RingBuffer<number>(3);
    rb.push(1);
    expect(rb.sliceAfter((x) => x === 99)).toEqual([]);
  });
});
