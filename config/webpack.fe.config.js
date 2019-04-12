const path = require('path');
const webpack = require('webpack');

const client = {
  entry: {
    main: './src/main.js',
    boot: './src/boot.js'
  },
  output: {
    path: path.resolve(__dirname, '..', 'dist', 'public'),
    publicPath: '/dist/public/',
    filename: '[name].js'
  },
  devtool: 'inline',
  module: {
    rules: [
      {
        test: /\.tag.html$/,
        exclude: /node_modules/,
        use: [{
          loader: 'riot-tag-loader',
          options: {
            hot: true,
            type: 'es6',
          }
        }],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            plugins: ["@babel/plugin-proposal-class-properties"],
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.(css|scss)$/,
        use: [{loader: 'style-loader'}, {loader: 'css-loader'}, {loader: 'sass-loader'}],
      },
      {
        test: /\.(png|jpg|gif)$/,
        use: [
          {
            loader: 'file-loader',
            options: {},
          },
        ],
      },
    ],
  },
};

module.exports = client