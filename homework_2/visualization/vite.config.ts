import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: { groups: [{ name: 'diagram', test: /node_modules\/@(?:xyflow|radix-ui)/ }] },
      },
    },
  },
});
