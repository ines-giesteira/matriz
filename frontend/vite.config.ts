import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Em desenvolvimento, /api é encaminhado para o backend, para o cookie de sessão funcionar
// sem configurar CORS (docs/architecture.md, secção 6). A porta acompanha PORTA do .env.
const portaBackend = process.env.PORTA ?? '3000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': `http://localhost:${portaBackend}`,
    },
  },
});
