const webpack = require('webpack');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  optimization: {
    nodeEnv: 'production',
    minimize: true
  },
  performance: {
    hints: 'error'
  },
  output: {
    path: `${__dirname}/../build`,
    filename: 'eksearch.min.js',
    libraryTarget: 'var',
    libraryExport: 'default',
    library: 'eksearch'
  },
  devtool: false,
  mode: 'production',
  module: {
  },
  plugins: [
    new webpack.optimize.AggressiveMergingPlugin()
  ]
});
