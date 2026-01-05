// This plugin fetches modules.json and module.yml files for the specified repositories at build-time.
// Then it creates .md files for each module based on their module.yml's.

import type { StarlightPlugin } from "@astrojs/starlight/types";
import path from "node:path";
import * as fs from "fs";
import type { Module } from "./modulesJsonGeneratorPlugin";
import { jsonschemaToMarkdown } from "../lib/jsonschemaToMarkdown";
import type { JSONSchema } from "json-schema-typed";

export default function moduleReferencePlugin(): StarlightPlugin {
  return {
    name: "moduleReferencePlugin",
    hooks: {
      async setup() {
        const outputPath = "src/content/docs/reference/modules";
        if (fs.existsSync(outputPath)) {
          try {
            fs.rmSync(outputPath, { recursive: true });
            console.log(
              "Module reference directory cleared successfully before recreating: " +
                outputPath,
            );
          } catch (err: unknown) {
            throw new Error(
              "Failed to clear module reference directory before recreating: " +
                (err as Error).message,
            );
          }
        }
        fs.mkdir(outputPath, { recursive: true }, (err) => {
          if (err != null) {
            throw new Error(
              "Failed to create module reference directory: " + err.message,
            );
          } else {
            console.log(
              "Module reference directory created successfully: " + outputPath,
            );
          }
        });

        const modules = JSON.parse(
          fs.readFileSync("public/modules.json", "utf-8"),
        ) as Module[];

        for (const module of modules) {
          try {
            await generateReferencePage(module, outputPath);
          } catch (err: unknown) {
            throw new Error(
              "Failed to generate reference page for " +
                module.name +
                ": " +
                (err as Error).message,
            );
          }
        }
      },
    },
  };
}

async function generateReferencePage(
  module: Module,
  outputPath: string,
): Promise<void> {
  console.log("Generating page for: " + module.name);

  if (module.versions !== undefined) {
    for (const [idx, version] of module.versions.entries()) {
      if (version.readme !== undefined) {
        const readmeRes = await fetch(version.readme);
        const readme = await readmeRes.text();

        const schemaRes = await fetch(
          `https://schema.blue-build.org/modules/${module.name}-${version.version}.json`,
        );
        const schema = await schemaRes.json().catch(() => {});

        fs.mkdir(
          path.join(outputPath, module.name),
          { recursive: true },
          (err) => {
            if (err != null) {
              throw new Error(
                "Failed to create module reference directory: " + err.message,
              );
            } else {
              writeReferencePage(
                module.name + "@" + version.version,
                module.shortdesc ?? "",
                version.examples ?? [],
                schema as object,
                readme,
                rawUrlToEditUrl(version.readme ?? ""),
                {
                  hidden: true,
                },
                path.join(outputPath, module.name, version.version + ".md"),
              );
            }
          },
        );
        if (idx === module.versions.length - 1) {
          writeReferencePage(
            module.name,
            module.shortdesc ?? "",
            version.examples ?? [],
            schema as object,
            `:::note
This documentation page is for the latest version (${version.version}) of this module.
All available versions: ${module.versions.map((v) => `[${v.version}](${v.version})`).join(", ")}.
:::
` + readme,
            rawUrlToEditUrl(version.readme),
            {},
            path.join(outputPath, module.name + ".md"),
          );
        }
      }
    }
  } else {
    const readmeRes = await fetch(module.readme ?? "");
    const readme = await readmeRes.text();

    const schemaRes = await fetch(
      `https://schema.blue-build.org/modules/${module.name}-latest.json`,
    );
    const schema = await schemaRes.json().catch(() => {});

    writeReferencePage(
      module.name,
      module.shortdesc ?? "",
      module.examples ?? [],
      schema as { properties: object; required: string[] },
      readme,
      rawUrlToEditUrl(module.readme ?? ""),
      {},
      path.join(outputPath, module.name + ".md"),
    );
  }
}

function writeReferencePage(
  name: string,
  shortdesc: string,
  examples: string[],
  schema: object,
  readme: string,
  editUrl: string,
  sidebar: Record<string, any>,
  outputFile: string,
): void {
  const optionReference = generateOptionReference(schema);

  const content = `\
---
title: "${name}"
description: ${shortdesc}
editUrl: "${editUrl}"
sidebar: ${JSON.stringify(sidebar)}
---
${readme.replace(/^#{1}\s.*$/gm, "")}
## Example configuration
\`\`\`yaml
${examples[0]}
\`\`\`
${optionReference ?? ""}
`;

  fs.writeFile(outputFile, content, (err) => {
    if (err != null) {
      throw new Error("Failed to write reference page: " + err.message);
    } else {
      console.log("Reference page written successfully: " + outputFile);
    }
  });
}

// transforms the raw url to the github.com url for editing,
// which requires inserting /edit/ into the URL right after the repo part
// (right after the fifth slash in the string)
function rawUrlToEditUrl(url: string): string {
  const baseURL = url
    .replace("raw.githubusercontent.com", "github.com")
    .split("/")
    .slice(0, 5)
    .join("/");
  const refAndFilePath = url.split("/").slice(5).join("/");
  return `${baseURL}/edit/${refAndFilePath}`;
}

function generateOptionReference(schemaObj: object): string {
  if (schemaObj === undefined) return "";

  const schema: JSONSchema = schemaObj;

  const docs = jsonschemaToMarkdown(schema, {
    prefix: "Configuration options",
    includeDescription: false,
    includeType: false,
    excludedProps: ["type", "no-cache", "env", "secrets"],
  });

  return docs;
}
