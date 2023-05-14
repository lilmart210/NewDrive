import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgrPlugin from 'vite-plugin-svgr'

import path from 'path-browserify'


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(),svgrPlugin()],
  resolve : {
    alias : {
      path : "path-browserify",
    }
  }
})
