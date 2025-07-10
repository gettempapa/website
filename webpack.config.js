const path = require('path');

module.exports = {
  entry: './src/water-simulation.js',
  output: {
    filename: 'water-simulation.bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.(glsl|vs|fs|vert|frag)$/,
        exclude: /node_modules/,
        use: ['raw-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.glsl', '.vs', '.fs', '.vert', '.frag']
  }
}; 