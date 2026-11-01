import type { StarlightPlugin } from "@astrojs/starlight/types";
import * as fs from "fs";
import { jsonschemaToMarkdown } from "../lib/jsonschemaToMarkdown";
import type { JSONSchema } from "json-schema-typed";

const topV1 = `
---
title: recipe.yml (v1)
description: A \`recipe.yml\` file is used to configure a custom image.
---

A \`recipe.yml\` file describes the build process of a custom image. The top-level keys set the metadata and base for the image, and modules are build steps that add things on top of the base.

:::tip
This is the reference page for Recipe V1. We recommend using Recipe V2 instead. See the [Recipe V2 reference page](/reference/recipe-v2/). Don't know what this means or how to migrate from V1 to V2? Read the blog post: [Introducing Recipe V2](/blog/recipe-v2)
:::

:::tip
You can add the lines below to the top of your recipe to get yaml completion in your favorite editor.
\`\`\`
# yaml-language-server: $schema=https://schema.blue-build.org/recipe-v1.json
\`\`\`
:::

## Reference
`;

const topV2 = `
---
title: recipe.yml
description: A \`recipe.yml\` file is used to configure a custom image.
---

A \`recipe.yml\` file describes the build process of a custom image. One recipe file corresponds to one published image. Every recipe file specifies the full metadata, base image, and build process of a custom image.

:::tip
This is the reference page for Recipe V2. If you're still on V1, see the [Recipe V1 reference page](/reference/recipe-v1/). Don't know what this means? Read the blog post: [Introducing Recipe V2](/blog/recipe-v2)
:::

:::tip
You can add the lines below to the top of your recipe to get yaml completion in your favorite editor.
\`\`\`
# yaml-language-server: $schema=https://schema.blue-build.org/recipe-v2.json
\`\`\`
:::

## Reference
`;

export default function recipeReferencePlugin(): StarlightPlugin {
  return {
    name: "recipeReferencePlugin",
    hooks: {
      async setup() {
        {
          const outputPath = "src/content/docs/reference/recipe-v1.mdx";
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
          await fs.promises.writeFile(outputPath, topV1 + markdown);
        }

        {
          const outputPath = "src/content/docs/reference/recipe.mdx";
          const schemaURL = "https://schema.blue-build.org/recipe-v2.json";
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
          await fs.promises.writeFile(outputPath, topV2 + markdown);
        }
      },
    },
  };
}
