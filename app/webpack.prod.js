const path = require("path");
// For merging webpack config files
const {merge} = require("webpack-merge");
const common = require("./webpack.common.js");
// For minifying javascript
// https://webpack.js.org/plugins/terser-webpack-plugin/
const TerserJSPlugin = require("terser-webpack-plugin");
// For minifying css into one file
// https://webpack.js.org/plugins/mini-css-extract-plugin/#minimizing-for-production
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

// For Webpack 5
// https://github.com/webpack-contrib/css-minimizer-webpack-plugin
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

// Project paths
const PATH_SOURCE = path.join(__dirname, "./src"); // Source code path
const PATH_DIST = path.join(__dirname, "./dist"); // Build distribution path

let merged_config = merge(common, {
  // Tells webpack to use its built-in optimizations
  // https://webpack.js.org/configuration/mode/#mode-production
  mode: "production",

  // https://webpack.js.org/configuration/optimization/
  optimization: {
    // create a common single runtime bundle for all chunks, outputs a runtime.[fullhash].js
    // https://webpack.js.org/guides/caching/
    runtimeChunk: "single",
    // create a vendors chunk which contains all code from node_modules imported in the project
    // https://webpack.js.org/plugins/split-chunks-plugin/
    // https://itnext.io/react-router-and-webpack-v4-code-splitting-using-splitchunksplugin-f0a48f110312
    splitChunks: {
      cacheGroups: {
        // Turn off Webpack default settings for cacheGroup
        default: false,
        vendors: false,
        // Vendors chunk
        vendor: {
          // support sync and async chunks
          chunks: "all",
          // import file path containing node_modules or file ending with .custom.scss
          test: /[\\/]node_modules[\\/]|\.custom\.scss$/i,
          // name of the chunk
          name: "vendor"
        }
      }
    },
    // minify js and css
    minimizer: [new TerserJSPlugin(), new CssMinimizerPlugin()]
  },

  plugins: [
    // For CSS
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output both options are optional
      filename: "css/[name].[contenthash].css",
      chunkFilename: "css/[id].[fullhash].css" // Used for dynamic imports of code split (lazy loading)
    })
  ],

  // Tell Webpack where to emit the bundles it creates and how to name them.
  // https://webpack.js.org/concepts/output/
  // https://webpack.js.org/configuration/output/#outputfilename
  output: {
    path: PATH_DIST,
    filename: "js/[name].[fullhash].js",
    chunkFilename: "js/[name].[contenthash].js" // use contenthash for caching
  },

  module: {
    // For styling
    rules: [
      {
        // For CSS Modules .scss or .css file extensions (case insentitive)
        test: /\.(scss|css)$/i,
        exclude: [/[\\/]global[\\/]/, /[\\/]node_modules[\\/]/], // Exclude global styling files and files from node_modules
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: {
              modules: true,
              localsConvention: "camelCase", // Class names will be camelized, the original class name will not to be removed from the locals
              sourceMap: false
            }
          },
          {
            loader: "sass-loader",
            options: {
              sourceMap: false
            }
          }
        ]
      },
      {
        // For global standard .scss or .css file extensions (case insentitive)
        test: /\.(scss|css)$/i,
        include: /[\\/]global[\\/]/,
        exclude: /\.custom\.scss$/i,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: {
              //localsConvention: "camelCase", //Enable if needed
              sourceMap: false
            }
          },
          {
            loader: "sass-loader",
            options: {
              sourceMap: false
            }
          }
        ]
      },
      {
        // For vendor (node_modules) .css file extensions (case insentitive)
        test: /\.(css)$/i,
        include: /[\\/]node_modules[\\/]/,
        use: [MiniCssExtractPlugin.loader, "css-loader"]
      },
      {
        // For global Bootstrap customization .custom.scss file extensions (case insentitive)
        test: /\.custom\.scss$/i,
        include: /[\\/]global[\\/]/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: (resourcePath, context) => {
                // publicPath is the relative path of the resource to the context
                // e.g. for ./css/admin/main.css the publicPath will be ../../
                // while for ./css/main.css the publicPath will be ../
                // https://webpack.js.org/plugins/mini-css-extract-plugin/#the-publicpath-option-as-function
                return path.relative(path.dirname(resourcePath), context) + '/';
              },
            }
          },
          {
            // translates CSS into CommonJS modules
            loader: "css-loader"
          },
          {
            // run post css actions
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: function() {
                  return [
                    require("autoprefixer")
                  ];
                }
              }
            }
          },
          {
            // compiles Sass to CSS
            loader: "sass-loader"
          }
        ]
      }
    ]
  }
});

module.exports = merged_config;

// For troubleshooting configuration
//console.log(JSON.stringify(merged_config));

/* Notes
 * Configuring CSS and CSS Modules
 * https://webpack.js.org/loaders/css-loader/#css-modules-and-pure-css
 * https://adamrackis.dev/css-modules/
 */
