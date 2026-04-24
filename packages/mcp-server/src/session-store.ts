import type { EventEnvelope, SlotState } from "@interactive-learning/protocol";
import jsonPatch from "fast-json-patch";
import type { Operation } from "fast-json-patch";
import { v7 as uuidv7 } from "uuid";
import { RingBuffer } from "./ring-buffer.js";

export interface RenderArgs {
  slot_id?: string;
  type: string;
  props: unknown;
  replace?: boolean;
  parent_slot?: string;
}

export interface UpdateArgs {
  slot_id: string;
  patch: ReadonlyArray<Operation>;
}

type EventInput = Omit<EventEnvelope, "event_id" | "timestamp">;

type Subscriber = (e: EventEnvelope) => void;

export class SessionStore {
  private readonly slots = new Map<string, SlotState>();
  private readonly events = new RingBuffer<EventEnvelope>(1000);
  private cursor = "";
  private slotSeq = 0;
  private readonly subscribers = new Set<Subscriber>();
  readonly startedAt = Date.now();
  readonly id = uuidv7();
  lastAgentToolCall = Date.now();
  browserConnected = false;

  render(args: RenderArgs): { slot_id: string; cursor: string } {
    this.lastAgentToolCall = Date.now();
    const existing = args.slot_id ? this.slots.get(args.slot_id) : undefined;

    if (args.slot_id && existing && !args.replace) {
      const err = new Error(
        "INVALID_OPERATION: slot exists; use update_component or set replace=true",
      );
      (err as { code?: string }).code = "INVALID_OPERATION";
      throw err;
    }

    const slot_id = args.slot_id ?? this.nextSlotId();
    const version = existing ? existing.version + 1 : 1;
    const slot: SlotState = {
      slot_id,
      version,
      type: args.type,
      props: args.props,
      ...(args.parent_slot ? { parent_slot: args.parent_slot } : {}),
    };
    this.slots.set(slot_id, slot);
    const ev = this.recordEvent({
      slot_id,
      slot_version: version,
      type: "component.rendered",
      payload: { replaced: Boolean(existing) },
    });
    return { slot_id, cursor: ev.event_id };
  }

  update(
    args: UpdateArgs,
    validateProps?: (type: string, props: unknown) => void,
  ): { cursor: string } {
    this.lastAgentToolCall = Date.now();
    const slot = this.slots.get(args.slot_id);
    if (!slot) {
      const err = new Error("NOT_FOUND: slot not found");
      (err as { code?: string }).code = "NOT_FOUND";
      throw err;
    }

    // Phase 1: compute + validate. No state mutation, no event, no cursor advance.
    let next: unknown;
    try {
      next = jsonPatch.applyPatch(
        structuredClone(slot.props),
        args.patch as Operation[],
        /*validate*/ true,
        /*mutate*/ false,
      ).newDocument;
    } catch (cause) {
      const err = new Error(
        `INVALID_PATCH: ${cause instanceof Error ? cause.message : String(cause)}`,
      );
      (err as { code?: string }).code = "INVALID_PATCH";
      throw err;
    }
    if (validateProps) validateProps(slot.type, next); // Zod throws; no state touched yet.

    // Phase 2: commit atomically — mutate state, emit event, advance cursor together.
    slot.props = next;
    const ev = this.recordEvent({
      slot_id: args.slot_id,
      slot_version: slot.version,
      type: "component.updated",
      payload: {},
    });
    return { cursor: ev.event_id };
  }

  recordEvent(input: EventInput): EventEnvelope {
    const event: EventEnvelope = {
      event_id: uuidv7(),
      timestamp: Date.now(),
      ...input,
    };
    this.events.push(event);
    this.cursor = event.event_id;
    for (const s of this.subscribers) s(event);
    return event;
  }

  eventsAfter(since: string | undefined): readonly EventEnvelope[] {
    if (since === undefined) return this.events.toArray();
    if (since === "") {
      const err = new Error("CURSOR_EXPIRED: empty cursor is invalid");
      (err as { code?: string }).code = "CURSOR_EXPIRED";
      throw err;
    }
    const arr = this.events.toArray();
    const idx = arr.findIndex((e) => e.event_id === since);
    if (idx < 0) {
      const err = new Error(
        "CURSOR_EXPIRED: cursor not in ring buffer; re-read session://current/state to reconcile",
      );
      (err as { code?: string }).code = "CURSOR_EXPIRED";
      throw err;
    }
    return arr.slice(idx + 1);
  }

  currentCursor(): string {
    return this.cursor;
  }

  getSlot(id: string): SlotState | undefined {
    return this.slots.get(id);
  }

  listSlots(): readonly SlotState[] {
    return [...this.slots.values()];
  }

  eventCount(): number {
    return this.events.length;
  }

  onEvent(cb: Subscriber): () => void {
    this.subscribers.add(cb);
    return () => this.subscribers.delete(cb);
  }

  snapshot(): {
    id: string;
    started_at: number;
    cursor: string;
    browser_connected: boolean;
    last_agent_tool_call: number;
    slots: readonly SlotState[];
    recent_events: readonly EventEnvelope[];
  } {
    return {
      id: this.id,
      started_at: this.startedAt,
      cursor: this.cursor,
      browser_connected: this.browserConnected,
      last_agent_tool_call: this.lastAgentToolCall,
      slots: this.listSlots(),
      recent_events: this.events.toArray(),
    };
  }

  private nextSlotId(): string {
    this.slotSeq += 1;
    return `slot-${this.slotSeq}`;
  }
}
