import colors from 'tailwindcss/colors';
import starlightPlugin from '@astrojs/starlight-tailwind';

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			colors: {
				// Accent colors generated from #A6DFFF using https://uicolors.app/
				accent: {
					'50': '#f0faff',
					'100': '#e0f3ff',
					'200': '#a8dfff',
					'300': '#81cdf8',
					'400': '#4babe7',
					'500': '#2086d5',
					'600': '#1466b8',
					'700': '#124e97',
					'800': '#113e78',
					'900': '#163464',
					'950': '#102042',
				},

				// Manually picked gray & white colors based on designed background & foreground colors.
				gray: {
					'200': '#DFE2FC',
					'300': '#D0D4F2',
					'400': '#92a4c8',
					'600': '#6773a8',
					'700': '#4F5379',
					'800': '#272A47',
					'900': '#141629',
				},
				white: '#FFF',

				// "Second accent color"
				highlight: {
					'50': '#fdf9ed',
					'100': '#f9eecc',
					'200': '#f3dd99',
					'300': '#ecc45d',
					'400': '#e7ae38',
					'500': '#e09020',
					'600': '#c66e19',
					'700': '#a44f19',
					'800': '#863e1a',
					'900': '#6e3419',
					'950': '#3f1a09',
				},
			},
			fontFamily: {
				display: ['Atkinson Hyperlegible', 'sans-serif'],
				sans: ['Rubik Variable', 'system-ui', 'sans-serif'],
				mono: ['IBM Plex Mono', 'monospace']
			},
			boxShadow: {
				'glow': '2px 2px 6px rgb(166,223,255,0.15)',
				'glow-active': '5px 5px 12px rgb(166,223,255,0.15)',
			}
		},
	},
	plugins: [starlightPlugin()],
};
