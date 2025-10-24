// Safe polyfills that won't break the app
if (typeof globalThis.Request === 'undefined') {
  globalThis.Request = function Request() {
    throw new Error('Request is not available in browser environment')
  }
}

if (typeof globalThis.Response === 'undefined') {
  globalThis.Response = function Response() {
    throw new Error('Response is not available in browser environment')
  }
}

// Ensure global is set
if (typeof global === 'undefined') {
  window.global = window
}