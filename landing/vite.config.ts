import type { UserConfig } from "vite"
import { resolve } from "node:path"

export default {
	resolve: {
		alias: {
			"@laranatech/tron-client": resolve(import.meta.dirname, "../client/src"),
		},
	},
	build: {
		rollupOptions: {
			input: {
				main: resolve(import.meta.dirname, "index.html"),
				play: resolve(import.meta.dirname, "play.html"),
			},
		},
	},
} satisfies UserConfig
