import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  return {
    plugins: [react()],
    resolve: { alias: { "@": path.resolve(__dirname, "src") } },
    server: { port: 5173, host: "localhost" },
    build: {
      target: "es2022",
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom", "react-router-dom"],
            motion: ["framer-motion"],
          },
        },
      },
    },
    define: {
      __API_URL__: JSON.stringify(env.VITE_API_URL ?? "http://localhost:8002"),
    },
  };
});
