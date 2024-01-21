import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'BlueBuild',
			social: {
				github: 'https://github.com/withastro/starlight',
			},
			sidebar: [
				{
					label: 'Learn',
					items: [
						{ label: 'Getting started', link: '/learn/getting-started/' }
					]
				},
				{
					label: 'How-to',
					autogenerate: { directory: 'how-to' },
				},
				{
					label: 'Reference',
					items: [
						{ label: 'recipe.yml', link: '/reference/recipe/' },
						{ label: 'Modules', autogenerate: {directory: 'reference/modules' } }
					]
				},
			],
			customCss: ['./src/tailwind.css'],
			components: {
				SocialIcons: './src/components/NavLinks.astro',
			},
			head: [
				{
					tag: 'script', 
					attrs: {
						defer: true,
						src: 'https://eu.umami.is/script.js',
						'data-website-id':'fdbab42b-cab4-4f46-b06a-172700ea1e1c'
					}
				}
			]
		}),
		tailwind({ applyBaseStyles: false }),
	],
});
