import { babel } from '@rollup/plugin-babel'

const config = {
  input: 'src/index.js',
  output: {
    dir: 'dist/lib/',
    format: 'iife',
    name: 'WooDoo',
    sourcemap: true,
    banner: '/* WooDoo - https://www.npmjs.com/package/woodoo @license:MIT */'
  },
  plugins: [babel({
    presets: [
      [
        '@babel/preset-env',
        {
          bugfixes: true,
          targets: '> 0.25%',
          modules: false
        }
      ]
    ]
  })]
}

export default config
