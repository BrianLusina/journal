// The Docker image's server answers /env.js itself, with the container's VITE_ variables (see
// server/envScript.ts). Elsewhere, such as on Vercel, this empty default leaves the app on the
// values Vite inlined at build time.
window.__ENV__ = window.__ENV__ || {};
