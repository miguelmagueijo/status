import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from "@tailwindcss/vite";
import { env } from "process";

// https://vite.dev/config/
export default defineConfig({
    plugins: [svelte(), tailwindcss()],
    define: {
        "__APP_VERSION__": JSON.stringify(env.npm_package_version),
    }
})
