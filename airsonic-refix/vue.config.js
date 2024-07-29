const webpack = require('webpack');
const moment = require('moment');

module.exports = {
  devServer: {
    allowedHosts: 'all',
    client: {
      overlay: {
        warnings: false
      }
    }
  },
  configureWebpack: {
    plugins: [
      new webpack.DefinePlugin({
        'process.env.BUILD_HASH': JSON.stringify(require('child_process').execSync('git rev-parse --short HEAD').toString().trim()),
        'process.env.BUILD_DATE': JSON.stringify(moment().format('YYYY-MM-DD HH:mm:ss'))
      })
    ]
  }
}
