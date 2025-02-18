// This plugin fetches modules.json and module.yml files for the specified repositories at build-time.
// Then it creates .md files for each module based on their module.yml's.

import type { StarlightPlugin } from "@astrojs/starlight/types";
import path from "node:path";
import * as fs from "fs";
import type { Module } from "./modulesJsonGeneratorPlugin";

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

                const modules = JSON.parse(
                    fs.readFileSync("public/modules.json", "utf-8"),
                ) as Module[];

                for (const module of modules) {
                    generateReferencePage(module, outputPath).catch((err) => {
                        throw new Error(
                            "Failed to generate reference page: " + err.message,
                        );
                    });
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
                                "Failed to create module reference directory: " +
                                    err.message,
                            );
                        } else {
                            writeReferencePage(
                                module.name + "@" + version.version,
                                module.shortdesc ?? "",
                                version.examples ?? [],
                                schema as {
                                    properties: object;
                                    required: string[];
                                },
                                readme,
                                rawUrlToEditUrl(version.readme ?? ""),
                                {
                                    hidden: true,
                                },
                                path.join(
                                    outputPath,
                                    module.name,
                                    version.version + ".md",
                                ),
                            );
                        }
                    },
                );
                if (idx === module.versions.length - 1) {
                    writeReferencePage(
                        module.name,
                        module.shortdesc ?? "",
                        version.examples ?? [],
                        schema as { properties: object; required: string[] },
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
    const optionReference = generateOptionReference(
        schema as { properties: object; required: string[] },
    );

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
${optionReference !== "" ? `## Configuration options\n ${optionReference}` : ""}
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

function generateOptionReference(schema: {
    properties: object;
    required: string[];
}): string {
    if (schema === undefined) return "";

    let out = "";

    function generatePropReferences(
        properties: object,
        headerLevel: string,
    ): string {
        let out = "";
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        for (const [key, value] of Object.entries(properties)) {
            if (key === "type" || key === "no-cache") continue;
            const prop = value as {
                type: string;
                description?: string;
                default?: string;
                anyOf?: Array<{ type: string; const: string }>;
                properties?: object;
                items?: { anyOf: Array<{ type: string; const: string }> };
            };
            const required = schema.required?.includes(key)
                ? "required"
                : "optional";
            const type =
                prop.type ?? (value.anyOf !== undefined ? "enum" : "unknown");

            out += `${headerLevel} \`${key}:\` (${required} ${type})
${prop.description ?? "*No description provided...*"}

${type === "object" ? generatePropReferences(prop.properties ?? {}, headerLevel + "#") : ""}
${type === "array" && prop.items?.anyOf !== undefined ? "Possible values: " + prop.items.anyOf.map((v) => "`" + v.const + "`").join(", ") + "<br>" : ""}
${type === "enum" ? "Possible values: " + prop.anyOf?.map((v) => "`" + parseEnumValue(v) + "`").join(", ") + "<br>" : ""}
${prop.default !== undefined ? `Default: \`${prop.default}\`` : ""}
            \n`;
        }
        return out;
    }

    out += generatePropReferences(schema.properties, "###");

    return out;
}

function parseEnumValue(v: any): string {
    if (v.const !== undefined) return v.const;

    if (v.items !== undefined) {
        if (v.items.$ref === "#/$defs/RecordString") return "string: string";
        if (v.items.type === "object") {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            return `{ ${Object.entries(v.items.properties)
                .map((p) => `${p[0]}: ${(p[1] as { type: string }).type}`)
                .join(", ")} }`;
        }
    }

    return "Unknown type";
}
