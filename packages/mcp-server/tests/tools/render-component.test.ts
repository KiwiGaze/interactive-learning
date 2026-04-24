import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { CatalogRegistry } from "../../src/catalog.js";
import { SessionStore } from "../../src/session-store.js";
import { renderComponentHandler } from "../../src/tools/render-component.js";

describe("render_component handler", () => {
  let store: SessionStore;
  let catalog: CatalogRegistry;

  beforeEach(() => {
    store = new SessionStore();
    catalog = new CatalogRegistry();
    catalog.register({
      type: "Quiz",
      props: z.object({ questions: z.array(z.object({ id: z.string() })) }),
      events: {},
    });
  });

  it("returns slot_id + cursor on new render", async () => {
    const out = await renderComponentHandler({
      store,
      catalog,
      input: {
        type: "Quiz",
        props: { questions: [{ id: "q1" }] },
      },
    });
    expect(out.slot_id).toMatch(/^slot-/);
    expect(out.cursor).toBeDefined();
  });

  it("surfaces UNKNOWN_COMPONENT as InvalidParams", async () => {
    await expect(
      renderComponentHandler({
        store,
        catalog,
        input: {
          type: "Nope",
          props: {},
        },
      }),
    ).rejects.toMatchObject({ code: -32602 });
  });

  it("replace=true increments version", async () => {
    const { slot_id } = await renderComponentHandler({
      store,
      catalog,
      input: {
        type: "Quiz",
        props: { questions: [] },
      },
    });
    await renderComponentHandler({
      store,
      catalog,
      input: {
        slot_id,
        type: "Quiz",
        props: { questions: [] },
        replace: true,
      },
    });
    expect(store.getSlot(slot_id)?.version).toBe(2);
  });

  it("passes parent_slot into rendered slot state", async () => {
    const { slot_id } = await renderComponentHandler({
      store,
      catalog,
      input: {
        parent_slot: "parent-1",
        type: "Quiz",
        props: { questions: [] },
      },
    });

    expect(store.getSlot(slot_id)?.parent_slot).toBe("parent-1");
  });
});
