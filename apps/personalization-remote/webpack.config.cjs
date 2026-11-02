module.exports = require('../../scripts/webpack.base.cjs')({ dir: __dirname, name: 'personalization', exposes: { './PersonalizationApp': './src/PersonalizationApp.tsx' } });
