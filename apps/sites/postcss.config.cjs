// Tailwind 3 through PostCSS: @astrojs/tailwind stops at Astro 5, and both apps stay on Tailwind 3
// until they upgrade together.
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
