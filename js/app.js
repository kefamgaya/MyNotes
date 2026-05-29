/* app.js */
import { supabase } from './config.js';
import * as store from './store.js';
import * as notesLogic from './notes.js';
import * as ui from './ui.js';
import { searchNotes } from './search.js';
import { sortNotes } from './sort.js';
import { initDragAndDrop } from './drag.js';
import { debounce } from './utils.js';
import { initAuth, showAuthScreen } from './auth.js';

// Application State
let notes = [];
let activeNoteId = null;
let searchQuery = '';
let currentSort = 'recent';
let deletedNoteBuffer = null; // Buffer to support undo delete
let currentUser = null;

// Theme application helper
function applyTheme(theme) {
  document.body.classList.remove('theme-light', 'theme-dark');
  if (theme === 'light') {
    document.body.classList.add('theme-light');
  } else if (theme === 'dark') {
    document.body.classList.add('theme-dark');
  }
}

// Event handlers
function handleNoteClick(noteId) {
  activeNoteId = noteId;
  const note = notes.find(n => n.id === noteId);
  ui.renderEditor(note);
  ui.renderNoteList(getProcessedNotes(), activeNoteId);
  ui.setMobileView(true); // Switch view on mobile to show editor
}

async function handleNotePin(noteId) {
  const note = notes.find(n => n.id === noteId);
  if (note) {
    const updated = notesLogic.togglePin(note);
    await store.saveNote(updated);
    await refreshData();
    
    // If the pinned note was the active one, update editor UI
    if (activeNoteId === noteId) {
      ui.renderEditor(updated);
    }
  }
}

function handleNoteDelete(noteId) {
  ui.showDeleteConfirmationModal(async () => {
    const noteToDelete = notes.find(n => n.id === noteId);
    if (noteToDelete) {
      deletedNoteBuffer = noteToDelete;
      await store.deleteNote(noteId);
      
      // If we deleted the currently active note, select another or clear
      if (activeNoteId === noteId) {
        activeNoteId = null;
        ui.renderEditor(null);
        ui.setMobileView(false);
      }
      
      await refreshData();
      
      // Show toast notifications with Undo action
      ui.showToast('Note deleted', async () => {
        if (deletedNoteBuffer) {
          await store.saveNote(deletedNoteBuffer);
          activeNoteId = deletedNoteBuffer.id;
          deletedNoteBuffer = null;
          await refreshData();
          const restoredNote = notes.find(n => n.id === activeNoteId);
          ui.renderEditor(restoredNote);
          ui.setMobileView(true);
        }
      });
    }
  });
}

async function handleThemeChange(theme) {
  await store.setThemePreference(theme);
  applyTheme(theme);
}

function handleExportBackup() {
  try {
    const dataStr = JSON.stringify(notes, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'noteflow_backup_' + new Date().toISOString().split('T')[0] + '.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    ui.showToast('Backup file downloaded');
  } catch(e) {
    ui.showToast('Failed to export backup');
  }
}

async function handleImportBackup(file) {
  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      const importedNotes = JSON.parse(event.target.result);
      if (Array.isArray(importedNotes)) {
        // Validate each note has required fields or add them
        const validatedNotes = importedNotes.map(n => {
          return {
            id: n.id || crypto.randomUUID(),
            title: n.title || 'Untitled Note',
            body: n.body || '',
            pinned: !!n.pinned,
            createdAt: n.createdAt || new Date().toISOString(),
            updatedAt: n.updatedAt || new Date().toISOString()
          };
        });
        
        // Save imported notes sequentially
        for (const n of validatedNotes) {
          await store.saveNote(n);
        }
        
        ui.showToast(`Imported ${validatedNotes.length} notes successfully`);
        await refreshData();
        if (activeNoteId === '__settings__') {
          renderSettingsView();
        }
      } else {
        ui.showToast('Invalid backup file format');
      }
    } catch(e) {
      ui.showToast('Error reading or parsing backup file');
    }
  };
  reader.readAsText(file);
}

async function handleResetWorkspace() {
  const confirmReset = confirm('Are you sure you want to completely reset NoteFlow? This will permanently delete all your notes from the database.');
  if (confirmReset) {
    await store.clearAllData();
    notes = [];
    activeNoteId = null;
    currentSort = 'recent';
    await refreshData();
    applyTheme('system');
    ui.renderEditor(null);
    ui.showToast('Workspace reset completed');
  }
}

function renderSettingsView() {
  if (!currentUser) return;
  const meta = currentUser.user_metadata || {};
  ui.renderEditor('__settings__', {
    notes: notes,
    theme: store.getThemePreference(),
    email: currentUser.email,
    fullName: meta.full_name,
    username: meta.username
  });
}

// Debounced auto-save handler for editor changes
const saveNoteDebounced = debounce(async (noteId, fields) => {
  const note = notes.find(n => n.id === noteId);
  if (note) {
    const updated = notesLogic.updateNote(note, fields);
    await store.saveNote(updated);
    
    // Refresh list view to show updated timestamps/previews without reloading the editor
    refreshNotesListOnly();
    ui.updateEditorFooterStats(updated);
  }
}, 500);

function handleNoteChange(noteId, fields) {
  // Immediately update local note array cache so search/list renders correctly if user is typing
  const localNote = notes.find(n => n.id === noteId);
  if (localNote) {
    localNote.title = fields.title;
    localNote.body = fields.body;
    localNote.updatedAt = new Date().toISOString();
  }
  
  // Call debounced storage save
  saveNoteDebounced(noteId, fields);
}

// Data operations
async function refreshData() {
  notes = await store.getAllNotes();
  const processed = getProcessedNotes();
  ui.renderNoteList(processed, activeNoteId);
}

// Custom refresh to update UI in both standard list mode and active settings mode
function refreshNotesListOnly() {
  ui.renderNoteList(getProcessedNotes(), activeNoteId);
}

function getProcessedNotes() {
  let result = searchNotes(notes, searchQuery);
  result = sortNotes(result, currentSort);
  return result;
}

// Sign out trigger
async function handleSignOut() {
  await supabase.auth.signOut();
  window.location.hash = '#/auth';
}

// Setup Event Listeners
function setupEventListeners() {
  // New note actions
  const newNoteBtn = document.getElementById('new-note-btn');
  if (newNoteBtn) {
    newNoteBtn.addEventListener('click', async () => {
      const newNote = notesLogic.createNote();
      await store.saveNote(newNote);
      activeNoteId = newNote.id;
      await refreshData();
      ui.renderEditor(newNote);
      ui.setMobileView(true);
    });
  }

  // Settings button in sidebar footer (fallback bindings)
  const settingsBtn = document.getElementById('sidebar-settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      activeNoteId = '__settings__';
      renderSettingsView();
      ui.renderNoteList(getProcessedNotes(), activeNoteId);
      ui.setMobileView(true);
    });
  }

  // Search input
  const searchInput = document.querySelector('.search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      refreshNotesListOnly();
    });
  }

  // Sort dropdown selector
  const sortSelect = document.querySelector('.sort-select');
  if (sortSelect) {
    sortSelect.value = currentSort;
    sortSelect.addEventListener('change', async (e) => {
      currentSort = e.target.value;
      await store.setSortPreference(currentSort);
      refreshNotesListOnly();
    });
  }

  // Topbar Pin Button
  const topPinBtn = document.getElementById('topbar-pin-btn');
  if (topPinBtn) {
    topPinBtn.addEventListener('click', () => {
      if (activeNoteId && activeNoteId !== '__settings__') {
        handleNotePin(activeNoteId);
      }
    });
  }

  // Topbar Share Button
  const shareBtn = document.getElementById('topbar-share-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      if (activeNoteId && activeNoteId !== '__settings__') {
        const note = notes.find(n => n.id === activeNoteId);
        if (note) {
          const shareText = `Note: ${note.title}\n\n${note.body}`;
          navigator.clipboard.writeText(shareText).then(() => {
            ui.showToast('Note copied to clipboard');
          }).catch(() => {
            ui.showToast('Failed to copy note');
          });
        }
      }
    });
  }

  // Topbar More Options Dropdown
  const moreBtn = document.getElementById('topbar-more-btn');
  const moreMenu = document.getElementById('more-options-menu');
  if (moreBtn && moreMenu) {
    // Toggle dropdown on button click
    moreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      moreMenu.classList.toggle('dropdown-menu--open');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      moreMenu.classList.remove('dropdown-menu--open');
    });

    // Prevent clicks inside menu from closing it prematurely
    moreMenu.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Handle menu item actions
    moreMenu.querySelectorAll('.dropdown-menu__item').forEach(item => {
      item.addEventListener('click', async () => {
        const action = item.dataset.action;
        moreMenu.classList.remove('dropdown-menu--open');

        if (!activeNoteId || activeNoteId === '__settings__') {
          ui.showToast('Select a note first');
          return;
        }

        if (action === 'duplicate') {
          const original = notes.find(n => n.id === activeNoteId);
          if (original) {
            const copy = { ...original };
            copy.id = crypto.randomUUID();
            copy.title = copy.title + ' (Copy)';
            copy.createdAt = new Date().toISOString();
            copy.updatedAt = copy.createdAt;
            await store.saveNote(copy);
            activeNoteId = copy.id;
            await refreshData();
            ui.renderEditor(copy);
            ui.showToast('Note duplicated');
          }
        } else if (action === 'export') {
          const note = notes.find(n => n.id === activeNoteId);
          if (note) {
            const content = `Title: ${note.title}\n\n${note.body}`;
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${note.title || 'note'}.txt`;
            a.click();
            URL.revokeObjectURL(url);
            ui.showToast('Note exported');
          }
        } else if (action === 'copy') {
          const note = notes.find(n => n.id === activeNoteId);
          if (note) {
            const text = `${note.title}\n\n${note.body}`;
            navigator.clipboard.writeText(text).then(() => {
              ui.showToast('Copied to clipboard');
            }).catch(() => {
              ui.showToast('Failed to copy');
            });
          }
        }
      });
    });
  }

  // Back button (mobile)
  const backBtn = document.querySelector('.back-button');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      ui.setMobileView(false);
    });
  }

  // Drag and Drop ordering
  const notesContainer = document.querySelector('.sidebar__notes-list');
  if (notesContainer) {
    initDragAndDrop(notesContainer, async (newOrderedIds) => {
      // Switch sorting preference to manual order
      currentSort = 'manual';
      await store.setSortPreference(currentSort);
      
      const sortSelect = document.querySelector('.sort-select');
      if (sortSelect) {
        sortSelect.value = 'manual';
      }
      
      // Save order modifications to Supabase
      await store.updateNoteOrder(newOrderedIds);
      
      // Update in-memory state
      notes = await store.getAllNotes();
    });
  }
}

// Central SPA Hash Routing logic
let isAppInitialized = false;

async function handleRoute() {
  const hash = window.location.hash || '#/';
  
  const { data: { session } } = await supabase.auth.getSession();
  
  const appContainer = document.querySelector('.app-container');
  const authContainer = document.querySelector('.auth-container');
  
  if (hash === '#/auth') {
    // Auth route
    if (session) {
      // Already authenticated -> redirect to dashboard
      window.location.hash = '#/';
      return;
    }
    
    // Hide dashboard, show auth container
    if (appContainer) {
      appContainer.style.setProperty('display', 'none', 'important');
    }
    showAuthScreen();
  } else {
    // Notes board / dashboard route
    if (!session) {
      // Unauthenticated -> redirect to auth
      window.location.hash = '#/auth';
      return;
    }
    
    currentUser = session.user;
    
    // Hide auth screen, show dashboard
    if (authContainer) {
      authContainer.style.setProperty('display', 'none', 'important');
    }
    
    // Initialize Dashboard UI once (if not already done)
    if (!isAppInitialized) {
      isAppInitialized = true;
      
      // Sync sort and theme settings from database on success
      await store.syncPreferencesFromDatabase();

      // Load local state
      currentSort = store.getSortPreference();
      
      // Load notes from Supabase
      notes = await store.getAllNotes();

      // Load and apply user theme preference
      const savedTheme = store.getThemePreference();
      applyTheme(savedTheme);

      // Setup UI elements and logic routes
      ui.initUI({
        onNoteClick: handleNoteClick,
        onNotePin: handleNotePin,
        onNoteDelete: handleNoteDelete,
        onNoteChange: handleNoteChange,
        onThemeChange: handleThemeChange,
        onExportBackup: handleExportBackup,
        onImportBackup: handleImportBackup,
        onResetWorkspace: handleResetWorkspace,
        onSignOut: handleSignOut
      });

      // Render the beautiful profile info and Sign Out in the sidebar footer
      ui.renderSidebarFooter(currentUser, () => {
        activeNoteId = '__settings__';
        renderSettingsView();
        ui.renderNoteList(getProcessedNotes(), activeNoteId);
        ui.setMobileView(true);
      }, handleSignOut);

      setupEventListeners();
      
      // Register storage warning feedback
      store.registerStorageErrorListener((error) => {
        ui.showToast('Database write failed! Please check your connection.');
      });
    } else {
      // On returning navigation, fetch latest notes array from store
      notes = await store.getAllNotes();
    }
    
    // Render initial notes list and clear active editor view
    const processed = getProcessedNotes();
    ui.renderNoteList(processed, activeNoteId);
    ui.renderEditor(null);
    
    // Reveal dashboard smoothly and hide loading splash screen
    if (appContainer) {
      appContainer.style.setProperty('display', 'flex', 'important');
    }
    
    const splashScreen = document.getElementById('app-splash-screen');
    if (splashScreen) {
      splashScreen.classList.add('splash-screen--fade-out');
      setTimeout(() => {
        splashScreen.remove();
      }, 400);
    }
  }
}

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
  // Setup Authentication event handlers
  initAuth();
  
  // Execute routing check
  handleRoute();
  
  // Attach router to hashchange events
  window.addEventListener('hashchange', handleRoute);
});
