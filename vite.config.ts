import path from "path";
import dts from "vite-plugin-dts";
import { viteStaticCopy } from "vite-plugin-static-copy";

type AssetInfo = {
  name: string;
  source: string | Uint8Array;
  type: "asset";
};

export default {
  build: {
    copyPublicDir: false,
    lib: {
      entry: {
        main: path.resolve(__dirname, "src/texditor.ts"),
        blocks: path.resolve(__dirname, "src/blocks/index.ts"),
        tools: path.resolve(__dirname, "src/tools/index.ts"),
        locales: path.resolve(__dirname, "src/locales/index.ts")
      },
      name: "Texditor",
      fileName: (format: string, entryName: string) => {
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
        assetFileNames: (assetInfo: AssetInfo) => {
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
      outDir: "dist/types",
      entryRoot: "src",
      rollupTypes: false,
      copyDtsFiles: true
    })
  ],

  server: {
    port: 3232,
    cors: true,
    host: true
  }
};
