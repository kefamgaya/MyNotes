/* notes.js */
import { generateId } from './utils.js';

/**
 * Creates a new note object.
 * @param {string} [title=""]
 * @param {string} [body=""]
 * @returns {object}
 */
export function createNote(title = '', body = '') {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    title: title || 'Untitled Note',
    body: body,
    createdAt: now,
    updatedAt: now,
    pinned: false,
    order: 0,
  };
}

/**
 * Updates a note object's properties and sets a new updatedAt timestamp.
 * @param {object} note
 * @param {object} updates
 * @returns {object}
 */
export function updateNote(note, updates) {
  const now = new Date().toISOString();
  const updatedNote = {
    ...note,
    ...updates,
    updatedAt: now,
  };
  
  if (updatedNote.title.trim() === '') {
    updatedNote.title = 'Untitled Note';
  }
  
  return updatedNote;
}

/**
 * Toggles the pinned state of a note.
 * @param {object} note
 * @returns {object}
 */
export function togglePin(note) {
  return updateNote(note, { pinned: !note.pinned });
}
