const webpack = require('webpack');

module.exports = {
  configureWebpack: {
    plugins: [
      // ---- do not bundle moment locales
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/locale$/,
        contextRegExp: /moment$/
      }),
      // ---- do not bundle astronomia vsop planet data
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/vsop87B.*$/
      })
    ]
  }
}
