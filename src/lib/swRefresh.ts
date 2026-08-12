/**
 * The service worker precaches index.html and serves it cache-first, so a new
 * worker can install and activate while the page on screen still runs the old
 * bundle. That makes a deploy look like it never landed until the user reloads
 * a second time by hand. Reload once, automatically, when a new worker takes
 * control.
 */
export function reloadOnServiceWorkerUpdate() {
  if (!('serviceWorker' in navigator)) return;

  // No controller means this is a first visit or a hard-reloaded page: nothing
  // stale is on screen, and reloading here would loop.
  if (!navigator.serviceWorker.controller) return;

  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });
}
