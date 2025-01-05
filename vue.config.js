const path = require('path');

module.exports = {
  outputDir: path.resolve(__dirname, './dist'),
  chainWebpack: config => {
    config.module
      .rule('audio')
      .test(/\.(mp3|wav|ogg)$/)
      .use('file-loader')
      .loader('file-loader')
      .options({
        name: 'assets/[name].[hash:8].[ext]'
      });
  },
  devServer: {
    proxy: 'http://localhost:4000'
  },
  configureWebpack: {
    optimization: {
      minimize: false
    }
  },
  parallel: false
};
