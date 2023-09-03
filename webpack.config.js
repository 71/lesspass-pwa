const path    = require('path'),
      webpack = require('webpack')

const { CleanWebpackPlugin } = require('clean-webpack-plugin'),
      CopyWebpackPlugin      = require('copy-webpack-plugin'),
      HtmlWebpackPlugin      = require('html-webpack-plugin'),
      MiniCssExtractPlugin   = require('mini-css-extract-plugin'),
      WorkboxPlugin          = require('workbox-webpack-plugin')

const DEV = process.env.NODE_ENV === 'development' ||
            process.env.WEBPACK_DEV_SERVER === 'true'


/** @type webpack.Configuration */
const development = {
  mode: 'development',
  devtool: 'inline-source-map',

  devServer: {
    publicPath: '/',
  },
}

/** @type webpack.Configuration */
const production = {
  mode: 'production',
}

const base = DEV ? development : production


/** @type webpack.Configuration */
module.exports = {
  ...base,

  entry: {
    index: './src/index.ts',
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: './[name].bundle.js',
    publicPath: '/',
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              hmr: DEV,
            },
          },
          'css-loader',
        ],
      },
      {
        test: /\.styl$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              hmr: DEV,
            },
          },
          'css-loader',
          'stylus-loader',
        ],
      },
      {
        test: /\.(woff2?|ttf|eot|png)?$/,
        use: [
          {
            loader: 'file-loader',
            options: {},
          },
        ],
      },
    ]
  },

  plugins: [
    ...(DEV ? [] : [
      new CleanWebpackPlugin(),
    ]),

    new MiniCssExtractPlugin({
      filename: DEV ? './[name].css' : './[name].[hash].css',
      chunkFilename: DEV ? './[id].css' : './[id].[hash].css',
    }),

    new HtmlWebpackPlugin({
      chunks: ['index'],
      template: '!!pug-loader!src/index.pug',
      filename: 'index.html',
      favicon: 'src/assets/favicon.png',
    }),

    new CopyWebpackPlugin([
      'src/assets/CNAME',
      'src/assets/icon.png',
      'src/manifest.webmanifest',
    ]),

    ...(DEV ? [] : [
      new WorkboxPlugin.GenerateSW({
        exclude: ['CNAME'],
      }),
    ])
  ],
}
