import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import {tanstackRouter} from '@tanstack/router-plugin/vite'
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [tanstackRouter({target: 'react', autoCodeSplitting: false}), tailwindcss(), react()],
})
