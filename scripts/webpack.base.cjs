const path = require('node:path');
const { ModuleFederationPlugin } = require('webpack').container;
const react18 = { singleton: true, requiredVersion: '^18.0.0' };

/** Cấu hình dùng chung. Constitution #1: react/react-dom singleton; #5: event-bus/shared-types singleton. */
module.exports = function make({ dir, name, exposes }) {
  return {
    mode: 'development', devtool: false, context: dir, entry: './src/index.ts',
    output: { path: path.join(dir, 'dist'), publicPath: 'auto', clean: true },
    resolve: { extensions: ['.tsx', '.ts', '.js'] },
    module: { rules: [
      { test: /\.[jt]sx?$/, resolve: { fullySpecified: false } },
      { test: /\.tsx?$/, exclude: /node_modules/, loader: 'ts-loader',
        options: { transpileOnly: true, configFile: path.resolve(__dirname, '..', 'tsconfig.json') } },
      { test: /\.css$/, use: ['style-loader', 'css-loader', 'postcss-loader'] },
    ] },
    plugins: [new ModuleFederationPlugin({
      name,
      ...(exposes ? { filename: 'remoteEntry.js', exposes } : {}), // Host không expose gì
      shared: {
        react: react18, 'react-dom': react18, 'react/jsx-runtime': react18, 'react-dom/client': react18,
        '@app/event-bus': { singleton: true }, '@app/shared-types': { singleton: true },
      },
    })],
  };
};
