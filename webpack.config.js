const path = require('path')

module.exports = {
    entry: {
        main: './src/index.js',
        variable_inspector: './src/variable_inspector.js'
    },
    target: 'electron',
    module: {
        loaders: [
            { test: /\.js$/, loader: 'babel-loader', exclude: /(node_modules|main)/ }
        ]
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist')
    },
}
