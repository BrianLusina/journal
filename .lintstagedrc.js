module.exports = {
  '*.{js,jsx,ts,tsx}': ['eslint --fix'],
  'apps/blog/src/**/*.css': ['stylelint --ignore-path apps/blog/.stylelintignore --allow-empty-input'],
  '*.{png,jpeg,jpg,gif,svg}': ['imagemin-lint-staged'],
};
