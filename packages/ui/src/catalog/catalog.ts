import type { ComponentType } from "react";
import type { z } from "zod";

export interface UiComponentEntry<P = unknown> {
  type: string;
  Component: ComponentType<{ slotId: string; slotVersion: number; props: P }>;
  propsSchema: z.ZodType<P> | undefined;
}

class UiCatalog {
  private readonly entries = new Map<string, UiComponentEntry>();

  register<P>(entry: UiComponentEntry<P>): void {
    this.entries.set(entry.type, entry as UiComponentEntry);
  }

  get(type: string): UiComponentEntry | undefined {
    return this.entries.get(type);
  }

  list(): UiComponentEntry[] {
    return [...this.entries.values()];
  }
}

export const UI_CATALOG = new UiCatalog();
