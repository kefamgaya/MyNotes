/* utils.js */

/**
 * Generates a unique string ID.
 * @returns {string}
 */
export function generateId() {
  return crypto.randomUUID();
}

/**
 * Formats an ISO date string into a human-readable format like "May 21, 2026" or "Today".
 * @param {string} dateString
 * @returns {string}
 */
export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  return date.toLocaleDateString(undefined, options);
}

/**
 * Debounces a function call by a given delay.
 * @param {Function} func
 * @param {number} delay
 * @returns {Function}
 */
export function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

/**
 * Truncates a string to a given limit and appends ellipses if truncated.
 * @param {string} str
 * @param {number} limit
 * @returns {string}
 */
export function truncate(str, limit = 100) {
  if (!str) return '';
  if (str.length <= limit) return str;
  return str.substr(0, limit) + '...';
}
