import EventEmitter from 'events';

export const authAgent = window.authAgent = new EventEmitter();

/*
 * A helper template to that opens the provided URL in a centered popup.
 * Accepts an `options` object with `width` and `height` number properties.
 */
export function openLoginPopup (url, options = {}) {
  let width = options.width || 1024;
  let height = options.height || 640;
  let {top, left} = getCenterCoordinates(window, width, height);
  let params = `width=${width}, height=${height}, top=${top}, left=${left}`;
  return window.open(url, 'authWindow', params);
}

/*
 * Returns the coordinates to center a popup window in the viewport with
 * the provided width and height args.
 */
export function getCenterCoordinates (window, width, height) {
  return {
    left: window.screenX + (window.outerWidth - width) / 2,
    top: window.screenY + (window.outerHeight - height) / 2
  };
}
