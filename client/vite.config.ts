import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@entre-extremos/shared": path.resolve(__dirname, "../shared/index.ts"),
    },
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: [".ngrok-free.app", ".ngrok-free.dev", ".ngrok.io", ".ngrok.app"],
    proxy: {
      "/socket.io": {
        target: "http://localhost:3001",
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
