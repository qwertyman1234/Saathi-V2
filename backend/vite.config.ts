import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  define: {
    __FIREBASE_AUTH__: 'window.__FIREBASE_AUTH__',
  },
  plugins: [react()],
});
