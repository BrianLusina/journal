const observe = vi.fn();

window.IntersectionObserver = vi.fn(function () {
  this.observe = observe;
});
