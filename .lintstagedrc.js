module.exports = {
  '*.{js,jsx,ts,tsx}': ['eslint --fix'],
  'src/**/*.css': ['stylelint'],
  '*.{png,jpeg,jpg,gif,svg}': ['imagemin-lint-staged'],
};
