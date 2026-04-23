import type { CatalogRegistry } from "../catalog.js";

export async function readCatalogResource(deps: { catalog: CatalogRegistry }) {
  return {
    contents: [
      {
        uri: "catalog://components",
        mimeType: "application/json",
        text: JSON.stringify(deps.catalog.toJson(), null, 2),
      },
    ],
  };
}
