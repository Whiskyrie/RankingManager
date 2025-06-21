import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Resolver configuração para path aliases
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/components": path.resolve(__dirname, "./src/components"),
      "@/lib": path.resolve(__dirname, "./src/lib"),
      "@/utils": path.resolve(__dirname, "./src/utils"),
      "@/types": path.resolve(__dirname, "./src/types"),
      "@/store": path.resolve(__dirname, "./src/store"),
      "@/pages": path.resolve(__dirname, "./src/pages"),
      "@/data": path.resolve(__dirname, "./src/data"),
      "@/hooks": path.resolve(__dirname, "./src/hooks"),
    },
  },

  // Configurações de desenvolvimento
  server: {
    port: 3000,
    host: true,
    open: true,
  },

  // Configurações de build
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: true,
    target: "es2020",
    minify: "esbuild",

    // Otimizações de build
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar bibliotecas grandes em chunks específicos
          "react-vendor": ["react", "react-dom"],
          "ui-vendor": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
          ],
          "utils-vendor": ["zustand", "uuid", "date-fns"],
          "pdf-vendor": ["jspdf"],
        },
      },
    },

    // Aumentar limite de chunk para evitar warnings
    chunkSizeWarningLimit: 1000,
  },

  // Configurações de otimização
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "zustand",
      "uuid",
      "date-fns",
      "jspdf",
      "lucide-react",
      "clsx",
      "tailwind-merge",
    ],
    exclude: ["@vite/client", "@vite/env"],
  },

  // Configurações de preview
  preview: {
    port: 3000,
    host: true,
    open: true,
  },

  // Configurações de CSS
  css: {
    postcss: "./postcss.config.js",
    devSourcemap: true,
  },

  // Configurações do ambiente
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === "development"),
    __VERSION__: JSON.stringify(process.env.npm_package_version || "1.0.0"),
  },

  // Configurações de assets
  assetsInclude: ["**/*.pdf", "**/*.docx"],

  // Configurações para PWA (caso necessário no futuro)
  // Comentado para não adicionar dependências desnecessárias
  /*
  pwa: {
    registerType: 'autoUpdate',
    workbox: {
      globPatterns: ['**\/*.{js,css,html,ico,png,svg}']
    }
  }
  */
});
