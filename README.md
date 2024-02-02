# BlueBuild website

This repository contains the website and documentation for BlueBuild. The site itself, https://blue-build.org/ is built using [Astro](https://starlight.astro.build/), [Starlight](https://starlight.astro.build/) and [Tailwind CSS](https://tailwindcss.com/).

## Documentation

All documentation and the front page is written [`src/content/docs/`](./src/content/docs/) as either Markdown or [`MDX`](https://mdxjs.com/). The directory is rendered into docs by Starlight, and can be added into the docs sidebar in [`astro.config.mjs`](./astro.config.mjs). Markdown frontmatter is used to set metadata for each, including the title, so there is no need for a Markdown top-level title. 

The documentation strives to broadly follow the [Diátaxis framework](https://diataxis.fr/). [`/learn/`](./src/content/docs/learn/) is mostly [explanation](https://diataxis.fr/explanation/), [`/how-to/`](./src/content/docs/how-to/) is [how-to guides](https://diataxis.fr/how-to-guides/), and [`/reference/`](./src/content/docs/reference/) is obviously [reference](https://diataxis.fr/reference/).

To add images to documentation pages, the standard Markdown syntax should be used (`![alt](src)`). The source should be somewhere in [`src/content/docs/`](./src/content/docs/) or [`src/assets/`](./src/assets/). These images will be optimized automatically. Including meaningful alt-text is required.

## Components

Custom components are used to implement custom designs and new features. The code for the is stored in [`src/components/`](./src/components/). For static use cases, [Astro components](https://docs.astro.build/en/core-concepts/astro-components/) should be used. If more reactivity is needed, using [Svelte](https://svelte.dev/) components is preferred (none used yet). 

Icons can be used anywhere on this site with the `Icon` component from [`astro-icon`](https://www.astroicon.dev/). Use [Icones](https://icones.js.org/) to search for icons. New icon sets need to be added with `pnpm add @iconify-json/<collectionName>`.

## Creator (not implemented)

The tooling part of this site will be written in [`src/pages/creator/`](./src/pages/creator/) mostly using [Svelte](https://svelte.dev/).

## Local development

This project requires `node` and `npm` or [`pnpm`](https://pnpm.io/) for local development. A [Devbox](https://www.jetpack.io/devbox/) configuration is provided and can be activated by running `devbox shell` in the project directory (if Devbox is installed).

To get started with local development install the dependencies:
```sh
pnpm install # pnpm is recommended for faster speeds, use whatever you want
```

Then to start the dev server to preview your changes:
```sh
pnpm dev
# or
npm run dev
```