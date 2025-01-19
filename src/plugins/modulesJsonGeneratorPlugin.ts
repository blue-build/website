// This plugin fetches modules.json and module.yml files for the specified repositories at build-time.
// Then it creates .md files for each module based on their module.yml's.

import type { StarlightPlugin } from "@astrojs/starlight/types";
import * as fs from "fs";

export default function modulesJsonGeneratorPlugin(
    options: modulesJsonGeneratorPluginOptions,
): StarlightPlugin {
    return {
        name: "modulesJsonGeneratorPlugin",
        hooks: {
            async setup() {
                const modules: Array<{
                    name: string;
                    readme: string;
                    sh: string;
                    tsp: string;
                    yml: string;
                }> = [];
                for (const moduleSource of options.moduleSources) {
                    const modulesRes = await fetch(
                        moduleSource.source,
                        process.env.GH_TOKEN !== undefined
                            ? {
                                  headers: {
                                      Authorization: `Bearer ${process.env.GH_TOKEN}`,
                                  },
                              }
                            : {},
                    );
                    const modulesJson = (await modulesRes.json()) as Array<{
                        name: string;
                        url: string;
                    }>;
                    for (const moduleJson of modulesJson) {
                        const moduleFilesRes = await fetch(moduleJson.url, {
                            headers: {
                                Authorization: `Bearer ${process.env.GH_TOKEN}`,
                            },
                        });
                        const moduleFilesJson = await moduleFilesRes.json();
                        if (!Array.isArray(moduleFilesJson)) continue;
                        const moduleFiles = moduleFilesJson as Array<{
                            name: string;
                            download_url: string;
                        }>;
                        const module: {
                            name: string;
                            readme: string;
                            sh: string;
                            tsp: string;
                            yml: string;
                        } = {
                            name: moduleJson.name,
                            readme: "",
                            sh: "",
                            tsp: "",
                            yml: "",
                        };
                        for (const file of moduleFiles) {
                            if (file.name === "README.md") {
                                module.readme = file.download_url;
                            } else if (file.name === `${module.name}.sh`) {
                                module.sh = file.download_url;
                            } else if (file.name === `${module.name}.tsp`) {
                                module.tsp = file.download_url;
                            } else if (file.name === "module.yml") {
                                module.yml = file.download_url;
                            }
                        }
                        if (module.yml === "") continue;
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

export interface modulesJsonGeneratorPluginOptions {
    moduleSources: Array<{
        source: string;
    }>;
}
