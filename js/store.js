/* store.js */
import { supabase } from './config.js';

const NOTES_KEY = 'noteflow_notes';
const SORT_KEY = 'noteflow_sort';
const THEME_KEY = 'noteflow_theme';

let errorListener = null;

/**
 * Registers a callback for database write errors.
 * @param {Function} callback
 */
export function registerStorageErrorListener(callback) {
  errorListener = callback;
}

/**
 * Triggers the registered storage error listener.
 * @param {Error} error
 */
function handleStorageError(error) {
  console.error('NoteFlow Supabase Error:', error);
  if (errorListener) {
    errorListener(error);
  }
}

/**
 * Reads all notes from Supabase for the current user.
 * @returns {Promise<Array>}
 */
export async function getAllNotes() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id);

    if (error) throw error;

    // Map database snake_case columns back to camelCase properties for app compatibility
    return (data || []).map(note => ({
      id: note.id,
      title: note.title,
      body: note.body,
      pinned: note.pinned,
      order: note.order,
      createdAt: note.created_at,
      updatedAt: note.updated_at
    }));
  } catch (error) {
    console.error('Failed to parse notes from Supabase. Returning empty list.', error);
    return [];
  }
}

/**
 * Retrieves a single note by its ID from Supabase.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function getNoteById(id) {
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      title: data.title,
      body: data.body,
      pinned: data.pinned,
      order: data.order,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Failed to fetch note from Supabase:', error);
    return null;
  }
}

/**
 * Saves or updates a note in Supabase.
 * @param {object} updatedNote
 * @returns {Promise<boolean>} Success status
 */
export async function saveNote(updatedNote) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const payload = {
      id: updatedNote.id,
      user_id: user.id,
      title: updatedNote.title,
      body: updatedNote.body,
      pinned: updatedNote.pinned,
      order: updatedNote.order,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('notes')
      .upsert(payload);

    if (error) throw error;
    return true;
  } catch (error) {
    handleStorageError(error);
    return false;
  }
}

/**
 * Deletes a note by its ID from Supabase.
 * @param {string} id
 * @returns {Promise<boolean>} Success status
 */
export async function deleteNote(id) {
  try {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    handleStorageError(error);
    return false;
  }
}

/**
 * Updates the manual drag order of note objects in Supabase.
 * @param {Array<string>} orderedIds - Array of note IDs in their new order
 * @returns {Promise<boolean>}
 */
export async function updateNoteOrder(orderedIds) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Build the bulk upsert payload
    const updates = orderedIds.map((id, index) => ({
      id: id,
      user_id: user.id,
      order: index
    }));

    const { error } = await supabase
      .from('notes')
      .upsert(updates);

    if (error) throw error;
    return true;
  } catch (error) {
    handleStorageError(error);
    return false;
  }
}

/**
 * Saves the user's sorting preference both locally and in Supabase.
 * @param {string} sortMode
 */
export async function setSortPreference(sortMode) {
  try {
    localStorage.setItem(SORT_KEY, sortMode);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('users')
        .update({ sort_preference: sortMode })
        .eq('id', user.id);
    }
  } catch (error) {
    console.error('Failed to save sort preference.', error);
  }
}

/**
 * Retrieves the saved sorting preference.
 * @returns {string} Defaults to 'recent'
 */
export function getSortPreference() {
  try {
    return localStorage.getItem(SORT_KEY) || 'recent';
  } catch (error) {
    return 'recent';
  }
}

/**
 * Saves the user's theme preference both locally and in Supabase.
 * @param {string} theme - 'system', 'light', or 'dark'
 */
export async function setThemePreference(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('users')
        .update({ theme_preference: theme })
        .eq('id', user.id);
    }
  } catch (error) {
    console.error('Failed to save theme preference.', error);
  }
}

/**
 * Retrieves the saved theme preference.
 * @returns {string} Defaults to 'system'
 */
export function getThemePreference() {
  try {
    return localStorage.getItem(THEME_KEY) || 'system';
  } catch (error) {
    return 'system';
  }
}

/**
 * Pulls both theme and sort preferences from the database to sync on sign in.
 */
export async function syncPreferencesFromDatabase() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('users')
      .select('theme_preference, sort_preference')
      .eq('id', user.id)
      .single();

    if (error) throw error;

    if (data) {
      if (data.theme_preference) {
        localStorage.setItem(THEME_KEY, data.theme_preference);
      }
      if (data.sort_preference) {
        localStorage.setItem(SORT_KEY, data.sort_preference);
      }
    }
  } catch (error) {
    console.warn('Could not sync user preferences from database:', error.message);
  }
}

/**
 * Resets the entire workspace, clearing all notes and preferences in database and local cache.
 */
export async function clearAllData() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Clear notes in Supabase
      await supabase.from('notes').delete().eq('user_id', user.id);
      // Reset user settings in Supabase
      await supabase.from('users').update({
        theme_preference: 'system',
        sort_preference: 'recent'
      }).eq('id', user.id);
    }

    localStorage.removeItem(SORT_KEY);
    localStorage.removeItem(THEME_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear workspace data.', error);
    return false;
  }
}
