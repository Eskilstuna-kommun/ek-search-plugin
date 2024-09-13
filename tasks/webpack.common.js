const webpack = require('webpack');

module.exports = {
  entry: [
    './eksearch.js'
  ],
  module: {
    rules: [{
      test: /\.(js)$/,
      exclude: /node_modules/
    }]
  },
  externals: ['Origo'],
  resolve: {
    extensions: ['*', '.js', '.scss']
  }
};
