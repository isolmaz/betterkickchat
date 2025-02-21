import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

// Copy assets to dist folder
const copyAssets = () => ({
  name: 'copy-assets',
  writeBundle() {
    // Create necessary directories
    const dirs = [
      'dist/assets',
      'dist/assets/icons'
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Copy manifest
    fs.copyFileSync('manifest.json', 'dist/manifest.json');

    // Copy styles
    fs.copyFileSync('src/styles.css', 'dist/styles.css');

    // Copy icons
    const iconSizes = [16, 32, 48, 128];
    iconSizes.forEach(size => {
      const iconPath = `src/assets/icons/icon${size}.png`;
      if (fs.existsSync(iconPath)) {
        fs.copyFileSync(iconPath, `dist/assets/icons/icon${size}.png`);
      }
    });

    // Create popup HTML
    const popupHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kick Chat Enhancer</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="popup.js"></script>
</body>
</html>`;

    fs.writeFileSync('dist/popup.html', popupHtml);
  }
});

export default defineConfig({
  plugins: [react(), copyAssets()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/background/index.ts'),
        content: resolve(__dirname, 'src/content/index.ts'),
        popup: resolve(__dirname, 'src/popup/index.tsx'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    },
    cssCodeSplit: false,
    sourcemap: true,
    minify: false,
  },
}); 