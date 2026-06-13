import { copyFileSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig({
  build: {
    cssCodeSplit: true,
    copyPublicDir: false,
    lib: {
      entry: {
        main: path.resolve(__dirname, 'src/texditor.ts'),
        locales: path.resolve(__dirname, 'src/locales/index.ts'),
        'entities/actions': path.resolve(__dirname, 'src/entities/actions/index.ts'),
        'entities/blocks': path.resolve(__dirname, 'src/entities/blocks/index.ts'),
        'entities/blocks/file/actions': path.resolve(__dirname, 'src/entities/blocks/file/actions/index.ts'),
        'entities/tools': path.resolve(__dirname, 'src/entities/tools/index.ts'),
        'entities/extensions': path.resolve(__dirname, 'src/entities/extensions/index.ts'),
        'core/models': path.resolve(__dirname, 'src/core/models/index.ts'),
        'core/base': path.resolve(__dirname, 'src/core/base/index.ts'),
      },
      name: 'Texditor',
      fileName: (_format: string, entryName: string) => {
        if (entryName === 'main') return 'texditor.mjs';
        return `${entryName}.mjs`;
      },
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: ({ name }: { name: string }) => {
          return name === 'main' ? 'texditor.mjs' : `${name}.mjs`;
        },
        assetFileNames: (assetInfo: { name?: string }) => {
          if (assetInfo.name?.endsWith('.css')) {
            let name = assetInfo.name;
            if (name?.includes('src/styles/')) {
              name = name.replace('src/styles/', '');
            }
            return `styles/${name}`;
          }
          return 'assets/[name][extname]';
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [
    cssInjectedByJsPlugin(),
    {
      name: 'copy-theme-css',
      closeBundle() {
        const src = path.resolve(__dirname, 'src/styles/theme.css');
        const destDir = path.resolve(__dirname, 'dist/styles');
        const dest = path.resolve(destDir, 'theme.css');

        mkdirSync(destDir, { recursive: true });
        copyFileSync(src, dest);

        const dtsContent = `declare const css: string;
export default css;`;

        writeFileSync(path.resolve(destDir, 'theme.d.ts'), dtsContent);
      },
    },
    dts({
      insertTypesEntry: true,
      include: ['src'],
      outDirs: ['dist'],
      entryRoot: 'src',
      copyDtsFiles: true,
      staticImport: true,
    }),
  ],
  server: {
    port: 3232,
    cors: true,
    host: true,
    open: '/app/index.html',
  },
});
