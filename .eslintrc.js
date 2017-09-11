module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module'
  },
  env: {
    mocha: true,
    browser: true,
    jasmine: true, // There is no 'chai' env available, use jasmine instead
  },
  extends: 'airbnb-base',
  // required to lint *.vue files
  plugins: [
    'html',
  ],
  // check if imports actually resolve
  'settings': {
    'import/resolver': {
      'webpack': {
        'config': 'build/webpack.base.conf.js'
      }
    },
  },
  // add your custom rules here
  'rules': {
    // allow optionalDependencies
    'import/no-extraneous-dependencies': 'off',
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
    // disallow dangling underscores in identifiers
    'no-underscore-dangle': 'off',
    // allow that class methods utilize this
    "class-methods-use-this": 'off',
    // disallow reassignment of function parameters
    // disallow parameter object manipulation
    // rule: http://eslint.org/docs/rules/no-param-reassign.html
    "no-param-reassign": ["off", { "props": true }],
    "arrow-parens": ["error", "as-needed"],
  }
}
