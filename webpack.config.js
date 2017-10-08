const path = require('path')

module.exports = {
    entry: './src/index.js',
    target: 'electron',
    module: {
        loaders: [
            { test: /\.js$/, loader: 'babel-loader', exclude: /(node_modules|main)/ }
        ]
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
}
