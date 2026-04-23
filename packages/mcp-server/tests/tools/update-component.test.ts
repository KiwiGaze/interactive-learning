import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { CatalogRegistry } from "../../src/catalog.js";
import { SessionStore } from "../../src/session-store.js";
import { updateComponentHandler } from "../../src/tools/update-component.js";

describe("update_component handler", () => {
  let store: SessionStore;
  let catalog: CatalogRegistry;

  beforeEach(() => {
    store = new SessionStore();
    catalog = new CatalogRegistry();
    catalog.register({
      type: "Quiz",
      props: z.object({
        title: z.string().optional(),
        reveal_mode: z.enum(["immediate", "on_submit"]).optional(),
      }),
      events: {},
    });
  });

  it("applies a valid replace patch", async () => {
    const { slot_id } = store.render({ type: "Quiz", props: { title: "a" } });
    const out = await updateComponentHandler({
      store,
      catalog,
      input: {
        slot_id,
        patch: [{ op: "replace", path: "/title", value: "b" }],
      },
    });
    expect(out.cursor).toBeDefined();
    expect(store.getSlot(slot_id)?.props).toMatchObject({ title: "b" });
  });

  it("rolls back on schema violation — props unchanged, no event, cursor unchanged", async () => {
    const { slot_id } = store.render({ type: "Quiz", props: { title: "a" } });
    const cursorBefore = store.currentCursor();
    const eventsBefore = store.eventCount();
    await expect(
      updateComponentHandler({
        store,
        catalog,
        input: {
          slot_id,
          patch: [{ op: "replace", path: "/reveal_mode", value: "bogus" }],
        },
      }),
    ).rejects.toBeDefined();
    expect(store.getSlot(slot_id)?.props).toMatchObject({ title: "a" });
    expect(store.currentCursor()).toBe(cursorBefore);
    expect(store.eventCount()).toBe(eventsBefore);
  });
});
