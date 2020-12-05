const path = require("path");
// For merging webpack config files
const {merge} = require("webpack-merge");
const common = require("./webpack.common.js");
// For minifying css into one file
// https://webpack.js.org/plugins/mini-css-extract-plugin/
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
// Bundle analyzer
// https://github.com/webpack-contrib/webpack-bundle-analyzer
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer")
  .BundleAnalyzerPlugin;

// Project paths
const PATH_SOURCE = path.join(__dirname, "./src"); // Source code path
const PATH_DIST = path.join(__dirname, "./dist"); // Build distribution path

let merged_config = merge(common, {
  // Tells webpack to use its built-in optimizations
  // https://webpack.js.org/configuration/mode/#mode-development
  mode: "development",

  devtool: "inline-source-map", // Maps complied code back to original source code

  devServer: {
    contentBase: "./dist", // Tells webpack-dev-server to serve files from the dist directory on localhost:8080
    hot: false // Allows modules to be updated at runtime without the need for a full refresh
  },

  optimization: {
    // create a common single runtime bundle for all chunks, outputs a runtime.[hash].js
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
    }
  },

  plugins: [
    // For CSS
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output both options are optional
      filename: "css/[name].css",
      chunkFilename: "css/[id].css" // Used for dynamic imports of code split (lazy loading)
    }),
    new BundleAnalyzerPlugin({
      analyzerMode: "disabled" // To disable use "disabled" or to show HTML report use "static"
    })
  ],

  // Tell Webpack where to emit the bundles it creates and how to name them.
  // https://webpack.js.org/concepts/output/
  // https://webpack.js.org/configuration/output/#outputfilename
  output: {
    path: PATH_DIST,
    filename: "js/[name].js",
    chunkFilename: "js/[name].js"
  },

  module: {
    // For styling
    rules: [
      {
        // For CSS Modules .scss or .css file extensions (case insentitive)
        test: /\.(scss|css)$/i,
        exclude: [/[\\/]global[\\/]/, /[\\/]node_modules[\\/]/], // Exclude global styling files and files from node_modules
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {}
          },
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
          {
            loader: MiniCssExtractPlugin.loader,
            options: {}
          },
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
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {}
          },
          "css-loader"
        ]
      },
      {
        // For global Bootstrap customization .custom.scss file extensions (case insentitive)
        test: /\.custom\.scss$/i,
        include: /[\\/]global[\\/]/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {}
          },
          "css-loader",
          {
            loader: "postcss-loader", // Run post css actions
            options: {
              plugins: function() {
                return [require("precss"), require("autoprefixer")];
              }
            }
          },
          "sass-loader"
        ]
      }
    ]
  }
});

module.exports = merged_config;

// For troubleshooting configuration
//console.log(JSON.stringify(merged_config));
