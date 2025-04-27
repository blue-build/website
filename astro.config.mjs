import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import tailwindcss from "@tailwindcss/vite";

// import icon from "astro-icon";
import moduleReferencePlugin from "./src/plugins/moduleReferencePlugin";
import githubActionReferencePlugin from "./src/plugins/githubActionReferencePlugin";
import modulesJsonGeneratorPlugin from "./src/plugins/modulesJsonGeneratorPlugin";


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
          social: [
              { icon: 'github', label: 'GitHub', href: 'https://github.com/blue-build/' },
          ],
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
                          label: "Troubleshooting, reporting bugs, and common issues",
                          link: "/learn/troubleshooting/",
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
                          label: "blue-build/github-action",
                          link: "/reference/github-action/",
                      },
                      {
                          label: "Module",
                          link: "/reference/module/",
                      },
                      {
                          label: "Stages",
                          link: "/reference/stages/",
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
              modulesJsonGeneratorPlugin({
                  moduleSources: [
                      {
                          source: "https://api.github.com/repos/blue-build/modules/contents/modules",
                      },
                      {
                          source: "https://api.github.com/repos/blue-build/cli/contents/template/templates/modules",
                      },
                  ],
              }),
              moduleReferencePlugin(),
              githubActionReferencePlugin({
                  source: "https://raw.githubusercontent.com/blue-build/github-action/main/action.yml",
                  path: "reference/github-action.md",
              }),
          ],
          customCss: [
              "@fontsource/atkinson-hyperlegible/400.css",
              "@fontsource/atkinson-hyperlegible/700.css",
              "@fontsource-variable/rubik",
              "@fontsource/ibm-plex-mono",
              "./src/styles/global.css",
          ],
          components: {
              SocialIcons: "./src/components/NavLinks.astro",
              Hero: "./src/components/Hero.astro",
              Footer: "./src/components/Footer.astro",
              Head: "./src/components/Head.astro",
              Search: "./src/components/Search.astro",
              Sidebar: "./src/components/Sidebar.astro",
              MarkdownContent: "./src/components/MarkdownContent.astro",
          },
          head: [
              {
                  tag: "script",
                  attrs: {
                      defer: true,
                      src: "https://eu.umami.is/script.js",
                      "data-website-id":
                          "fdbab42b-cab4-4f46-b06a-172700ea1e1c",
                  },
              },
          ],
      })
      // icon(),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});