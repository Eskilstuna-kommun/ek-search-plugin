const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  output: {
    path: `${__dirname}/../../origo/build/plugins`,
    publicPath: '/build/js',
    filename: 'eksearch.js',
    libraryTarget: 'var',
    libraryExport: 'default',
    library: 'eksearch'
  },
  mode: 'development',
  module: {
  },
  devServer: {
    port: 9011,
    static: './',
    devMiddleware: {
      //index: true,
      //mimeTypes: { 'text/html': ['phtml'] },
      //publicPath: '/publicPathForDevServe',
      //serverSideRender: true,
      writeToDisk: true
    }
  }
});
