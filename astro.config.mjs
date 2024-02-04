import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import tailwind from "@astrojs/tailwind";
import icon from "astro-icon";
import moduleReferencePlugin from "./src/plugins/moduleReferencePlugin";

// https://astro.build/config
export default defineConfig({
  site: "https://blue-build.org/",
  integrations: [
    starlight({
      title: "BlueBuild",
      logo: {
        replacesTitle: true,
        dark: "./src/assets/logo-dark.svg",
        light: "./src/assets/logo-light.svg",
        alt: "BlueBuild. A minimal logo with a blue-billed duck holding a golden wrench in its beak.",
      },
      editLink: {
        baseUrl: "https://github.com/blue-build/website/edit/main/",
      },
      social: {
        github: "https://github.com/blue-build/",
      },
      sidebar: [
        {
          label: "Learn",
          items: [
            {
              label: "Getting started",
              link: "/learn/getting-started/",
            },
            {
              label: "Thinking like a distribution",
              link: "/learn/mindset/",
            },
            {
              label: "Building on Universal Blue",
              link: "/learn/universal-blue/",
            },
            {
              label: "How BlueBuild works",
              link: "/learn/how/",
            },
            {
              label: "Contributing",
              link: "/learn/contributing/",
            },
            {
              label: "Scope",
              link: "/learn/scope/",
            },
          ],
        },
        {
          label: "How-to",
          autogenerate: {
            directory: "how-to",
          },
        },
        {
          label: "Reference",
          items: [
            {
              label: "recipe.yml",
              link: "/reference/recipe/",
            },
            {
              label: "Module",
              link: "/reference/module/",
            },
            {
              label: "Modules",
              autogenerate: {
                directory: "reference/modules",
              },
            },
          ],
        },
      ],
      plugins: [
        moduleReferencePlugin({moduleSources: [
          { source: "https://raw.githubusercontent.com/ublue-os/bling/moduleyml/modules.json", path: "reference/modules/" }
        ]})
      ],
      customCss: [
        "@fontsource/atkinson-hyperlegible/400.css",
        "@fontsource/atkinson-hyperlegible/700.css",
        "@fontsource-variable/rubik",
        "@fontsource/ibm-plex-mono",
        "./src/tailwind.css",
      ],
      components: {
        SocialIcons: "./src/components/NavLinks.astro",
        Hero: "./src/components/Hero.astro",
        Footer: "./src/components/Footer.astro",
        Head: './src/components/Head.astro',
      },
      head: [
        {
          tag: "script",
          attrs: {
            defer: true,
            src: "https://eu.umami.is/script.js",
            "data-website-id": "fdbab42b-cab4-4f46-b06a-172700ea1e1c",
          },
        },
      ],
    }),
    tailwind({
      applyBaseStyles: false,
    }),
    icon(),
  ],
});
