import {
  type ComponentCatalog,
  type ComponentCatalogJson,
  type ComponentDefinition,
  RESERVED_EVENT_PREFIXES,
} from "@interactive-learning/protocol";
import { z } from "zod";

export class CatalogRegistry implements ComponentCatalog {
  private readonly defs = new Map<string, ComponentDefinition>();

  register(def: ComponentDefinition): void {
    for (const evName of Object.keys(def.events)) {
      for (const prefix of RESERVED_EVENT_PREFIXES) {
        if (evName.startsWith(prefix)) {
          throw new Error(`RESERVED_NAMESPACE: event "${evName}" uses reserved prefix "${prefix}"`);
        }
      }
    }
    if (this.defs.has(def.type)) throw new Error(`DUPLICATE_COMPONENT: ${def.type}`);
    this.defs.set(def.type, def);
  }

  has(type: string): boolean {
    return this.defs.has(type);
  }

  get(type: string): ComponentDefinition | undefined {
    return this.defs.get(type);
  }

  list(): ReadonlyArray<ComponentDefinition> {
    return [...this.defs.values()];
  }

  validateProps(type: string, props: unknown): unknown {
    const def = this.defs.get(type);
    if (!def) {
      const err = new Error(`UNKNOWN_COMPONENT: ${type}`);
      (err as { code?: string }).code = "UNKNOWN_COMPONENT";
      throw err;
    }
    return def.props.parse(props);
  }

  toJson(): ComponentCatalogJson {
    return {
      components: this.list().map((component) => ({
        type: component.type,
        props_schema: z.toJSONSchema(component.props),
        events: Object.fromEntries(
          Object.entries(component.events).map(([key, schema]) => [key, z.toJSONSchema(schema)]),
        ),
      })),
    };
  }
}
