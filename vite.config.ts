import path from "path";
import { defineConfig } from 'vite';
import dts from "vite-plugin-dts";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  build: {
    copyPublicDir: false,
    lib: {
      entry: {
        main: path.resolve(__dirname, "src/texditor.ts"),
        locales: path.resolve(__dirname, "src/locales/index.ts"),
        'entities/actions': path.resolve(__dirname, "src/entities/actions/index.ts"),
        'entities/blocks': path.resolve(__dirname, "src/entities/blocks/index.ts"),
        'entities/tools': path.resolve(__dirname, "src/entities/tools/index.ts"),
        'entities/extensions': path.resolve(__dirname, "src/entities/extensions/index.ts"),
        "core/models": path.resolve(__dirname, "src/core/models/index.ts"),
        "core/base": path.resolve(__dirname, "src/core/base/index.ts")
      },
      name: "Texditor",
      fileName: (_format: string, entryName: string) => {
        if (entryName === "main") return "texditor.mjs";
        return `${entryName}.mjs`;
      },
      formats: ["es"]
    },
    rollupOptions: {
      output: {
        preserveModules: true,
        preserveModulesRoot: "src",
        entryFileNames: ({ name }: { name: string }) => {
          return name === "main" ? "texditor.mjs" : `${name}.mjs`;
        },
        assetFileNames: (assetInfo: { name?: string }) => {
          if (assetInfo.name?.endsWith(".css")) {
            return `styles/[name][extname]`;
          }
          return "assets/[name][extname]";
        }
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: "src/styles/theme.css",
          dest: "styles"
        }
      ]
    }),
    dts({
      insertTypesEntry: true,
      include: ["src"],
      outDir: "dist",
      entryRoot: "src",
      rollupTypes: false,
      copyDtsFiles: true,
      staticImport: true
    })
  ],
  server: {
    port: 3232,
    cors: true,
    host: true,
    open: '/app/index.html'
  }
});