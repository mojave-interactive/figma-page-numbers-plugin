import { defineConfig } from 'vite';
import singlefile from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [singlefile()],
  build: {
    assetsInlineLimit: 100000000, // inline all assets
  }
}); 