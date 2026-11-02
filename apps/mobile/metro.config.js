// Mobile dùng lại mã TypeScript thuần của monorepo (shared-types, facade-client, chat-state, chart-geometry) – KHÔNG dùng React của web.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const config = getDefaultConfig(__dirname);
config.watchFolders = [...(config.watchFolders ?? []), path.join(root, 'packages')];
config.resolver.extraNodeModules = Object.fromEntries(
  ['shared-types', 'facade-client', 'chat-state', 'chart-geometry'].map((n) => [`@app/${n}`, path.join(root, 'packages', n)]),
);
// Các package dùng chung chỉ import lẫn nhau; không để Metro tìm `react` trong node_modules gốc (React 18 của web).
config.resolver.nodeModulesPaths = [path.join(__dirname, 'node_modules')];
module.exports = config;
