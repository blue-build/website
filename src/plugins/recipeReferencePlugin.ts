import type { StarlightPlugin } from "@astrojs/starlight/types";
import * as fs from "fs";
import { jsonschemaToMarkdown } from "../lib/jsonschemaToMarkdown";
import type { JSONSchema } from "json-schema-typed";

const top = `
---
title: recipe.yml
description: A \`recipe.yml\` file is used to configure a custom image.
---

A \`recipe.yml\` file describes the build process of a custom image. The top-level keys set the metadata and base for the image, and modules are build steps that add things on top of the base.

:::tip
You can add the lines below to the top of your recipe to get yaml completion in your favorite editor.
\`\`\`
---
# yaml-language-server: $schema=https://schema.blue-build.org/recipe-v1.json
\`\`\`
:::

## Reference
`;

export default function recipeReferencePlugin(): StarlightPlugin {
  return {
    name: "recipeReferencePlugin",
    hooks: {
      async setup() {
        const outputPath = "src/content/docs/reference/recipe.mdx";
        const schemaURL = "https://schema.blue-build.org/recipe-v1.json";
        console.log("Fetching recipe schema...");
        const schema = (await (await fetch(schemaURL)).json()) as Exclude<
          JSONSchema,
          boolean
        >;
        console.log("Recipe schema fetched.");
        const markdown = jsonschemaToMarkdown(schema, {
          includeDescription: false,
          includeType: false,
          useLevel: false,
        });
        console.log("Recipe reference generated.");
        await fs.promises.writeFile(outputPath, top + markdown);
      },
    },
  };
}
