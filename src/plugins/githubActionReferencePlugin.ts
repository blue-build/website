// This plugin fetches the specified action.yml file and creates a markdown reference page for it.

import type { StarlightPlugin } from "@astrojs/starlight/types";
import path from "node:path";
import * as fs from "fs";
import { parse } from "yaml";

export default function githubActionReferencePlugin(
    options: GithubActionReferencePluginOptions,
): StarlightPlugin {
    return {
        name: "githubActionReferencePlugin",
        hooks: {
            async setup() {
                const outputPath = path.join("src/content/docs", options.path);
                if (fs.existsSync(outputPath)) {
                    try {
                        fs.rmSync(outputPath, { recursive: true });
                        console.log(
                            "GitHub Action reference page removed successfully before recreating: " +
                                outputPath,
                        );
                    } catch (err) {
                        throw new Error(
                            "Failed to clear GitHub Action reference page before recreating: " +
                                (err as Error).message,
                        );
                    }
                }
                const actionRes = await fetch(options.source);
                const actionYmlStr = await actionRes.text();
                const actionYml: { inputs: object } = parse(actionYmlStr);
                console.log("Generating GitHub Action reference page...");

                let inputs = "";
                for (const [name, input] of Object.entries(actionYml.inputs)) {
                    inputs += `
### \`${name}\` ${input.required === true ? "(required)" : "(optional)"}
${input.description}

${input.default !== undefined ? `Default: \`'${input.default}'\`` : ""}
                    `;
                }

                const content = `\
---
title: blue-build/github-action
description: Reference for the reusable GitHub Action to build custom images.
editUrl: https://github.com/blue-build/github-action/edit/main/action.yml
---
:::note
This is an automatically generated reference page for the [BlueBuild GitHub Action](https://github.com/blue-build/github-action/).
:::

## Inputs
${inputs}
`;
                fs.writeFile(outputPath, content, (err) => {
                    if (err != null) {
                        throw new Error(
                            "Failed to write reference page: " + err.message,
                        );
                    } else {
                        console.log(
                            "Reference page written successfully: " +
                                outputPath,
                        );
                    }
                });
            },
        },
    };
}

export interface GithubActionReferencePluginOptions {
    source: string;
    path: string;
}
