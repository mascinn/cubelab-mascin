import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit()
	],
	server: {
		watch: {
			ignored: ['**/rumus/**', '**/*.exe', '**/.git/**']
		},
		proxy: {
			'/api': {
				target: 'http://localhost:8085',
				changeOrigin: true
			}
		}
	},
	worker: {
		format: 'es'
	}
});
