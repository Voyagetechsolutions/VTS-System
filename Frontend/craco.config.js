const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // iOS Safari compatibility fixes
      
      // Ensure proper JS target for older iOS
      const babelRule = webpackConfig.module.rules.find(
        rule => rule.oneOf
      )?.oneOf?.find(
        rule => rule.test && rule.test.toString().includes('js|jsx')
      );
      
      if (babelRule && babelRule.options && babelRule.options.presets) {
        // Update babel preset to target iOS 10+
        const presetEnv = babelRule.options.presets.find(
          preset => Array.isArray(preset) && preset[0].includes('@babel/preset-env')
        );
        
        if (presetEnv && presetEnv[1]) {
          presetEnv[1].targets = {
            ...presetEnv[1].targets,
            ios: '10',
            safari: '10'
          };
        }
      }
      
      // Optimize bundle splitting for better iOS loading
      if (webpackConfig.optimization && webpackConfig.optimization.splitChunks) {
        webpackConfig.optimization.splitChunks = {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000, // Smaller chunks for iOS
          cacheGroups: {
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: -10,
              chunks: 'all',
              maxSize: 244000
            },
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: 'react',
              chunks: 'all',
              priority: 20
            },
            mui: {
              test: /[\\/]node_modules[\\/]@mui[\\/]/,
              name: 'mui',
              chunks: 'all',
              priority: 15
            }
          }
        };
      }
      
      // Add polyfills for iOS
      if (env === 'production') {
        webpackConfig.resolve.fallback = {
          ...webpackConfig.resolve.fallback,
          "crypto": false,
          "stream": false,
          "util": false,
          "buffer": false,
          "process": false
        };
      }
      
      return webpackConfig;
    },
  },
  babel: {
    presets: [
      [
        '@babel/preset-env',
        {
          targets: {
            ios: '10',
            safari: '10'
          }
        }
      ]
    ],
    plugins: [
      // Add polyfills for optional chaining and nullish coalescing
      '@babel/plugin-proposal-optional-chaining',
      '@babel/plugin-proposal-nullish-coalescing-operator',
      // Fix loose mode consistency warnings
      ['@babel/plugin-transform-class-properties', { 'loose': true }],
      ['@babel/plugin-transform-private-methods', { 'loose': true }],
      ['@babel/plugin-transform-private-property-in-object', { 'loose': true }]
    ]
  }
};
