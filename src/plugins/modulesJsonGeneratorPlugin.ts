// This plugin fetches modules.json and module.yml files for the specified repositories at build-time.
// Then it creates .md files for each module based on their module.yml's.

import type { StarlightPlugin } from "@astrojs/starlight/types";
import * as fs from "fs";
import { parse } from "yaml";

// TODO: refactor this to include the file content adapted from module.yml and not just the URLs

export interface Module {
    name: string;
    shortdesc: string | undefined;
    examples: string[] | undefined;
    readme: string | undefined;
    sh: string | undefined;
    tsp: string | undefined;
    versions:
        | Array<{
              version: string;
              examples: string[] | undefined;
              readme: string | undefined;
              sh: string | undefined;
          }>
        | undefined;
}

export interface modulesJsonGeneratorPluginOptions {
    moduleSources: Array<{
        source: string;
    }>;
}

export default function modulesJsonGeneratorPlugin(
    options: modulesJsonGeneratorPluginOptions,
): StarlightPlugin {
    return {
        name: "modulesJsonGeneratorPlugin",
        hooks: {
            async setup() {
                const modules: Module[] = [];
                for (const moduleSource of options.moduleSources) {
                    const modulesRes = await fetch(moduleSource.source, {
                        headers:
                            process.env.GH_TOKEN !== undefined
                                ? {
                                      Authorization: `Bearer ${process.env.GH_TOKEN}`,
                                  }
                                : {},
                    });
                    const modulesJson = (await modulesRes.json()) as Array<{
                        name: string;
                        url: string;
                    }>;
                    for (const moduleJson of modulesJson) {
                        const moduleFilesRes = await fetch(moduleJson.url, {
                            headers:
                                process.env.GH_TOKEN !== undefined
                                    ? {
                                          Authorization: `Bearer ${process.env.GH_TOKEN}`,
                                      }
                                    : {},
                        });
                        const moduleFilesJson = await moduleFilesRes.json();
                        if (!Array.isArray(moduleFilesJson)) continue;
                        const moduleFiles = moduleFilesJson as Array<{
                            name: string;
                            download_url: string;
                            url: string;
                        }>;

                        // @ts-expect-error object is to be initialized
                        const module: Module = {
                            name: moduleJson.name,
                            tsp: moduleFiles.find(
                                (file) =>
                                    file.name === `${moduleJson.name}.tsp`,
                            )?.download_url,
                        };

                        const moduleYmlUrl = moduleFiles.find(
                            (file) => file.name === "module.yml",
                        )?.download_url;
                        if (moduleYmlUrl === undefined) continue;

                        const moduleYmlRes = await fetch(moduleYmlUrl, {
                            headers:
                                process.env.GH_TOKEN !== undefined
                                    ? {
                                          Authorization: `Bearer ${process.env.GH_TOKEN}`,
                                      }
                                    : {},
                        });
                        const moduleYmlStr = await moduleYmlRes.text();
                        const moduleYml = parse(moduleYmlStr);

                        module.shortdesc = moduleYml.shortdesc;

                        if (moduleYml.versions !== undefined) {
                            module.versions = await Promise.all(
                                moduleYml.versions.map(async (v) => {
                                    const versionFilesURL = moduleFiles.find(
                                        (file) => file.name === v.version,
                                    )?.url;
                                    if (versionFilesURL === undefined) return;
                                    const versionFilesRes = await fetch(
                                        versionFilesURL,
                                        {
                                            headers:
                                                process.env.GH_TOKEN !==
                                                undefined
                                                    ? {
                                                          Authorization: `Bearer ${process.env.GH_TOKEN}`,
                                                      }
                                                    : {},
                                        },
                                    );
                                    const versionFiles =
                                        await versionFilesRes.json();

                                    return {
                                        version: v.version,
                                        examples: [v.example],
                                        readme: versionFiles.find(
                                            (file) => file.name === "README.md",
                                        )?.download_url,
                                        sh: versionFiles.find(
                                            (file) =>
                                                file.name ===
                                                    `${module.name}.sh` ||
                                                file.name ===
                                                    `${module.name}.nu`,
                                        )?.download_url,
                                    };
                                }),
                            );
                        } else {
                            module.readme = moduleFiles.find(
                                (file) => file.name === "README.md",
                            )?.download_url;
                            module.sh = moduleFiles.find(
                                (file) => file.name === `${module.name}.sh`,
                            )?.download_url;
                            module.examples = [moduleYml.example];
                        }

                        modules.push(module);
                    }
                }
                try {
                    fs.writeFileSync(
                        "public/modules.json",
                        JSON.stringify(modules, null, 2),
                    );
                    console.log("modules.json generated successfully.");
                } catch (err: any) {
                    throw new Error(
                        "Failed to write modules.json: " + err.message,
                    );
                }
            },
        },
    };
}
