import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "localhost",
    port: 5173,
    // If you need to expose to LAN or use a different hostname, set HMR accordingly:
    hmr: {
      host: "localhost",
      port: 5173,
      protocol: "ws", // or "wss" if you use HTTPS
    },
  },
  base: "./",
});
