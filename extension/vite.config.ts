/// <reference types='vitest' />

export default (async () => {
  const { defineConfig } = await import('vite');
  const react = (await import('@vitejs/plugin-react')).default;
  const { nxViteTsPaths } = await import('@nx/vite/plugins/nx-tsconfig-paths.plugin');
  const { nxCopyAssetsPlugin } = await import('@nx/vite/plugins/nx-copy-assets.plugin');

  return defineConfig(() => ({
  root: __dirname,
  cacheDir: '../node_modules/.vite/extension',
  server: {
    port: 4200,
    host: 'localhost',
  },
  preview: {
    port: 4200,
    host: 'localhost',
  },
  plugins: [react(), nxViteTsPaths(), nxCopyAssetsPlugin(['*.md'])],
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
  build: {
    outDir: '../dist/extension',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  test: {
    name: 'extension',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../coverage/extension',
      provider: 'v8' as const,
    },
  },
  }));
})();
