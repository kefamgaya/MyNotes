/* search.js */

/**
 * Filters notes based on a search query matching title or body content.
 * @param {Array} notes
 * @param {string} query
 * @returns {Array} Filtered notes array
 */
export function searchNotes(notes, query) {
  if (!query || query.trim() === '') {
    return notes;
  }
  
  const normalizedQuery = query.toLowerCase().trim();
  
  return notes.filter(note => {
    const titleMatch = note.title && note.title.toLowerCase().includes(normalizedQuery);
    const bodyMatch = note.body && note.body.toLowerCase().includes(normalizedQuery);
    return titleMatch || bodyMatch;
  });
}
