module.exports = require('../../scripts/webpack.base.cjs')({ dir: __dirname, name: 'chat', exposes: { './ChatApp': './src/ChatApp.tsx' } });
