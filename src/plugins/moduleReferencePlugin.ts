// This plugin fetches modules.json and module.yml files for the specified repositories at build-time.
// Then it creates .md files for each module based on their module.yml's.

import type { StarlightPlugin } from "@astrojs/starlight/types";
import path from "node:path";
import * as fs from "fs";
import { parse } from "yaml";

export default function moduleReferencePlugin(
    options: ModuleReferencePluginOptions,
): StarlightPlugin {
    return {
        name: "moduleReferencePlugin",
        hooks: {
            async setup() {
                for (const moduleSource of options.moduleSources) {
                    const outputPath = path.join(
                        "src/content/docs",
                        moduleSource.path,
                    );
                    if (fs.existsSync(outputPath)) {
                        try {
                            fs.rmSync(outputPath, { recursive: true });
                            console.log(
                                "Module reference directory cleared successfully before recreating: " +
                                    outputPath,
                            );
                        } catch (err) {
                            throw new Error(
                                "Failed to clear module reference directory before recreating: " +
                                    (err as Error).message,
                            );
                        }
                    }
                    fs.mkdir(outputPath, { recursive: true }, (err) => {
                        if (err != null) {
                            throw new Error(
                                "Failed to create module reference directory: " +
                                    err.message,
                            );
                        } else {
                            console.log(
                                "Module reference directory created successfully: " +
                                    outputPath,
                            );
                        }
                    });
                    const modulesRes = await fetch(moduleSource.source);
                    const modules = await modulesRes.json();
                    for (const module of modules) {
                        generateReferencePage(
                            module as string,
                            outputPath,
                        ).catch((err) => {
                            throw new Error(
                                "Failed to generate reference page: " +
                                    err.message,
                            );
                        });
                    }
                }
            },
        },
    };
}

export interface ModuleReferencePluginOptions {
    moduleSources: Array<{
        source: string;
        path: string;
    }>;
}

async function generateReferencePage(
    moduleYmlUrl: string,
    outputPath: string,
): Promise<void> {
    console.log("Fetching: " + moduleYmlUrl);
    const moduleYmlRes = await fetch(moduleYmlUrl);
    const moduleYmlStr = await moduleYmlRes.text();
    const moduleYml = parse(moduleYmlStr);
    console.log("Generating page for: " + moduleYml.name);

    const readmeRes = await fetch(moduleYml.readme as URL);
    const readme = await readmeRes.text();

    const content = `\
---
title: "${moduleYml.name}"
description: ${moduleYml.shortdesc}
editUrl: "${rawUrlToEditUrl(moduleYml.readme as string)}"
---
${readme.replace(/^#{1}\s.*$/gm, "")}
## Example configuration
\`\`\`yaml
${moduleYml.example}
\`\`\`
`;
    fs.writeFile(
        path.join(outputPath, moduleYml.name + ".md"),
        content,
        (err) => {
            if (err != null) {
                throw new Error(
                    "Failed to write reference page: " + err.message,
                );
            } else {
                console.log(
                    "Reference page written successfully: " +
                        path.join(outputPath, moduleYml.name + ".md"),
                );
            }
        },
    );
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
