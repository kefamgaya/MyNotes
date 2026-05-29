/* sort.js */

/**
 * Sorts an array of notes based on the chosen strategy, always keeping pinned notes at the top.
 * @param {Array} notes
 * @param {string} strategy - 'recent', 'created', 'title', or 'manual'
 * @returns {Array} Sorted notes copy
 */
export function sortNotes(notes, strategy) {
  return [...notes].sort((a, b) => {
    // Pinned notes are always prioritized at the top of the list
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    
    // Apply selected sorting strategy within their respective pinned/unpinned groups
    switch (strategy) {
      case 'created':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'title':
        // Case-insensitive alphabetical sorting
        return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
      case 'manual':
        return a.order - b.order;
      case 'recent':
      default:
        return new Date(b.updatedAt) - new Date(a.updatedAt);
    }
  });
}
