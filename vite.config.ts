import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
	resolve: {
		alias: {
			'@typst': path.resolve(__dirname, 'print_designer/public/js/typst'),
		},
	},
	test: {
		globals: true,
		environment: 'jsdom',
		include: ['**/tests/**/*.{test,spec}.ts'],
		ui: true,

	},
});