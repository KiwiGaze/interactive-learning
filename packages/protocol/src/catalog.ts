import type { z } from "zod";

export interface ComponentDefinition<Props = unknown> {
  readonly type: string;
  readonly props: z.ZodType<Props>;
  readonly events: Readonly<Record<string, z.ZodType<unknown>>>;
}

export interface ComponentCatalog {
  list(): ReadonlyArray<ComponentDefinition>;
  get(type: string): ComponentDefinition | undefined;
  has(type: string): boolean;
}

export interface ComponentCatalogJson {
  components: Array<{
    type: string;
    props_schema: unknown;
    events: Record<string, unknown>;
  }>;
}
