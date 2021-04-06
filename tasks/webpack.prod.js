const webpack = require('webpack');
const merge = require('webpack-merge');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  optimization: {
    nodeEnv: 'production',
    minimize: true
  },
  performance: {
    hints: false
  },
  output: {
    path: `${__dirname}/../../EK-extern/plugins`,
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
    new UglifyJSPlugin({
      uglifyOptions: {
        output: {
          beautify: false
        }
      }
    }),
    new webpack.optimize.AggressiveMergingPlugin()
  ]
});
