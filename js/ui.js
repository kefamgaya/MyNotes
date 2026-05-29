/* ui.js */
import { formatDate, truncate } from './utils.js';

// DOM Elements
let notesListContainer = null;
let editorScrollArea = null;
let toastContainer = null;
let toastMessage = null;
let toastUndoBtn = null;
let toastCloseBtn = null;
let deleteModal = null;
let deleteConfirmBtn = null;
let deleteCancelBtn = null;

// Callbacks registered from app.js
let onNoteClickCallback = null;
let onNotePinCallback = null;
let onNoteDeleteCallback = null;
let onNoteChangeCallback = null; // Fired on keyup/change in editor
let onThemeChangeCallback = null;
let onExportBackupCallback = null;
let onImportBackupCallback = null;
let onResetWorkspaceCallback = null;
let onSignOutCallback = null;

/**
 * Caches DOM elements and registers callbacks from app.js
 */
export function initUI(config) {
  notesListContainer = document.querySelector('.sidebar__notes-list');
  editorScrollArea = document.querySelector('.editor-panel__scroll-area');
  
  toastContainer = document.querySelector('.toast-container');
  toastMessage = document.querySelector('.toast__message');
  toastUndoBtn = document.querySelector('.toast__undo-btn');
  toastCloseBtn = document.querySelector('.toast__close-btn');
  
  deleteModal = document.querySelector('.modal-overlay');
  deleteConfirmBtn = document.getElementById('delete-confirm-btn');
  deleteCancelBtn = document.getElementById('delete-cancel-btn');

  onNoteClickCallback = config.onNoteClick;
  onNotePinCallback = config.onNotePin;
  onNoteDeleteCallback = config.onNoteDelete;
  onNoteChangeCallback = config.onNoteChange;
  
  // Settings callbacks
  onThemeChangeCallback = config.onThemeChange;
  onExportBackupCallback = config.onExportBackup;
  onImportBackupCallback = config.onImportBackup;
  onResetWorkspaceCallback = config.onResetWorkspace;
  onSignOutCallback = config.onSignOut;

  // Setup toast close event
  if (toastCloseBtn) {
    toastCloseBtn.addEventListener('click', hideToast);
  }
}

/**
 * Renders the note cards list in the sidebar.
 * @param {Array} notes
 * @param {string|null} activeNoteId
 */
export function renderNoteList(notes, activeNoteId) {
  if (!notesListContainer) return;
  
  notesListContainer.innerHTML = '';
  
  if (notes.length === 0) {
    const searchInput = document.querySelector('.search-input');
    const isSearching = searchInput && searchInput.value.trim() !== '';
    
    if (isSearching) {
      notesListContainer.innerHTML = `
        <div class="empty-state" style="padding: var(--spacing-lg) var(--spacing-sm);">
          <span class="material-symbols-outlined empty-state__icon" style="font-size: 32px;">search_off</span>
          <p class="empty-state__title" style="font-size: 14px;">No matches found</p>
          <p class="empty-state__desc" style="font-size: 12px;">We couldn't find any notes matching "${searchInput.value}".</p>
        </div>
      `;
    } else {
      notesListContainer.innerHTML = `
        <div class="empty-state" style="padding: var(--spacing-lg) var(--spacing-sm);">
          <span class="material-symbols-outlined empty-state__icon" style="font-size: 32px;">edit_note</span>
          <p class="empty-state__title" style="font-size: 14px;">No notes yet</p>
          <p class="empty-state__desc" style="font-size: 12px;">Create your first note to get started.</p>
        </div>
      `;
    }
    return;
  }
  
  notes.forEach(note => {
    const card = document.createElement('div');
    card.className = `note-card flat-tactile-card ${note.id === activeNoteId ? 'note-card--active' : ''}`;
    card.dataset.id = note.id;
    
    card.innerHTML = `
      <span class="material-symbols-outlined note-card__drag-handle" title="Drag to reorder">drag_indicator</span>
      <div class="note-card__content">
        <div class="note-card__header">
          <h3 class="note-card__title">${note.title.trim() || 'Untitled Note'}</h3>
          <span class="material-symbols-outlined note-card__pin-icon ${note.pinned ? 'note-card__pin-icon--active' : ''}">push_pin</span>
        </div>
        <p class="note-card__body-preview">${truncate(note.body, 70) || 'No additional text'}</p>
        <div class="note-card__footer">
          <span class="note-card__date">${formatDate(note.updatedAt || note.createdAt)}</span>
          <button class="note-card__delete-btn" title="Delete note">
            <span class="material-symbols-outlined" style="font-size: 16px;">delete</span>
          </button>
        </div>
      </div>
    `;
    
    // Card clicks
    card.addEventListener('click', (e) => {
      // Avoid triggering click if user clicked pin or delete button
      if (e.target.classList.contains('note-card__pin-icon')) {
        e.stopPropagation();
        onNotePinCallback(note.id);
        return;
      }
      if (e.target.closest('.note-card__delete-btn')) {
        e.stopPropagation();
        onNoteDeleteCallback(note.id);
        return;
      }
      onNoteClickCallback(note.id);
    });
    
    notesListContainer.appendChild(card);
  });
}

/**
 * Renders the active note details in the editor panel or the Workspace Settings view.
 * @param {object|string|null} note - Note object, or '__settings__' for settings page
 * @param {object} extraData - { notes: Array, theme: string, email: string, fullName: string, username: string }
 */
export function renderEditor(note, extraData = {}) {
  if (!editorScrollArea) return;

  if (note === '__settings__') {
    // Update breadcrumb navigation
    const breadcrumbActive = document.querySelector('.editor-panel__breadcrumbs .active');
    if (breadcrumbActive) {
      breadcrumbActive.textContent = 'Settings';
    }

    // Toggle header actions visibility
    const headerActions = document.querySelector('.editor-panel__actions');
    if (headerActions) {
      headerActions.style.visibility = 'hidden';
    }

    // Toggle footer visibility
    const editorFooter = document.querySelector('.editor-panel__footer');
    if (editorFooter) {
      editorFooter.style.visibility = 'hidden';
    }

    const notesList = extraData.notes || [];
    const currentTheme = extraData.theme || 'system';
    const email = extraData.email || '';
    const fullName = extraData.fullName || email.split('@')[0];
    const avatarLetter = (fullName ? fullName.charAt(0) : '?').toUpperCase();

    const notesCount = notesList.length;
    const pinnedCount = notesList.filter(n => n.pinned).length;
    const totalWords = notesList.reduce((acc, n) => acc + (n.body ? n.body.trim().split(/\s+/).filter(Boolean).length : 0), 0);

    editorScrollArea.innerHTML = `
      <div class="editor-panel__content-wrapper" style="gap: var(--spacing-lg); max-width: 650px;">
        <h2 style="font-size: 28px; font-weight: 700; margin-bottom: var(--spacing-sm); color: var(--on-surface);">Workspace Settings</h2>
        
        <!-- Account Profile Info -->
        <div class="flat-tactile-card" style="background-color: var(--surface-container-low); border: 1px solid var(--outline-variant); border-radius: var(--radius-lg); padding: var(--spacing-md); display: flex; flex-direction: column; gap: var(--spacing-sm);">
          <h3 style="font-size: 16px; font-weight: 600; color: var(--on-surface);">Account Information</h3>
          <p style="font-size: 13px; color: var(--on-surface-variant);">You are currently logged in and syncing your notes.</p>
          <div style="display: flex; align-items: center; gap: var(--spacing-md); margin-top: var(--spacing-xs);">
            <div class="profile-avatar" style="width: 48px; height: 48px; font-size: 18px;">${avatarLetter}</div>
            <div style="display: flex; flex-direction: column; gap: 2px;">
              <span style="font-size: 14px; font-weight: 600; color: var(--on-surface);">${fullName}</span>
              <span style="font-size: 12px; color: var(--on-surface-variant);">${email}</span>
            </div>
          </div>
          <div style="margin-top: var(--spacing-sm); border-top: 1px solid var(--outline-variant); padding-top: var(--spacing-md); display: flex; justify-content: flex-end;">
            <button id="settings-signout-btn" class="btn btn--danger" style="background-color: var(--tertiary-container); color: var(--on-tertiary);">
              <span class="material-symbols-outlined" style="font-size: 18px;">logout</span> Sign Out
            </button>
          </div>
        </div>

        <!-- Theme selection -->
        <div class="flat-tactile-card" style="background-color: var(--surface-container-low); border: 1px solid var(--outline-variant); border-radius: var(--radius-lg); padding: var(--spacing-md); display: flex; flex-direction: column; gap: var(--spacing-sm);">
          <h3 style="font-size: 16px; font-weight: 600; color: var(--on-surface);">Appearance</h3>
          <p style="font-size: 13px; color: var(--on-surface-variant);">Customize how NoteFlow looks on your device.</p>
          <div style="display: flex; gap: var(--spacing-md); align-items: center; margin-top: var(--spacing-xs);">
            <label style="font-size: 14px; font-weight: 500;" for="settings-theme-select">Interface Theme:</label>
            <select id="settings-theme-select" class="sort-select" style="background-color: var(--surface-container); border: 1px solid var(--outline-variant); border-radius: var(--radius-md); padding: 6px 12px; font-size: 14px; color: var(--on-surface);">
              <option value="system" ${currentTheme === 'system' ? 'selected' : ''}>System Default</option>
              <option value="light" ${currentTheme === 'light' ? 'selected' : ''}>Light Mode</option>
              <option value="dark" ${currentTheme === 'dark' ? 'selected' : ''}>Dark Mode</option>
            </select>
          </div>
        </div>

        <!-- Workspace metrics -->
        <div class="flat-tactile-card" style="background-color: var(--surface-container-low); border: 1px solid var(--outline-variant); border-radius: var(--radius-lg); padding: var(--spacing-md); display: flex; flex-direction: column; gap: var(--spacing-sm);">
          <h3 style="font-size: 16px; font-weight: 600; color: var(--on-surface);">Workspace Metrics</h3>
          <p style="font-size: 13px; color: var(--on-surface-variant);">Statistics for your active database cloud workspace.</p>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: var(--spacing-md); margin-top: var(--spacing-xs);">
            <div style="background-color: var(--surface-container-lowest); border: 1px solid var(--outline-variant); border-radius: var(--radius-md); padding: var(--spacing-sm) var(--spacing-md); text-align: center;">
              <div style="font-size: 20px; font-weight: 700; color: var(--primary);">${notesCount}</div>
              <div style="font-size: 11px; font-weight: 600; color: var(--on-surface-variant); text-transform: uppercase;">Total Notes</div>
            </div>
            <div style="background-color: var(--surface-container-lowest); border: 1px solid var(--outline-variant); border-radius: var(--radius-md); padding: var(--spacing-sm) var(--spacing-md); text-align: center;">
              <div style="font-size: 20px; font-weight: 700; color: var(--primary);">${pinnedCount}</div>
              <div style="font-size: 11px; font-weight: 600; color: var(--on-surface-variant); text-transform: uppercase;">Pinned Notes</div>
            </div>
            <div style="background-color: var(--surface-container-lowest); border: 1px solid var(--outline-variant); border-radius: var(--radius-md); padding: var(--spacing-sm) var(--spacing-md); text-align: center;">
              <div style="font-size: 20px; font-weight: 700; color: var(--primary);">${totalWords}</div>
              <div style="font-size: 11px; font-weight: 600; color: var(--on-surface-variant); text-transform: uppercase;">Total Words</div>
            </div>
          </div>
        </div>

        <!-- Data Portability -->
        <div class="flat-tactile-card" style="background-color: var(--surface-container-low); border: 1px solid var(--outline-variant); border-radius: var(--radius-lg); padding: var(--spacing-md); display: flex; flex-direction: column; gap: var(--spacing-sm);">
          <h3 style="font-size: 16px; font-weight: 600; color: var(--on-surface);">Data Portability</h3>
          <p style="font-size: 13px; color: var(--on-surface-variant);">Backup or restore your notes locally via JSON files.</p>
          
          <div style="display: flex; flex-wrap: wrap; gap: var(--spacing-md); margin-top: var(--spacing-xs);">
            <button id="settings-export-btn" class="btn btn--secondary">
              <span class="material-symbols-outlined" style="font-size:18px;">download</span> Export Backup
            </button>
            
            <button id="settings-import-trigger" class="btn btn--secondary">
              <span class="material-symbols-outlined" style="font-size:18px;">upload</span> Import Backup
            </button>
            <input type="file" id="settings-import-file" accept=".json" style="display: none;">
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="flat-tactile-card" style="border: 1px solid var(--tertiary-container); border-radius: var(--radius-lg); padding: var(--spacing-md); display: flex; flex-direction: column; gap: var(--spacing-sm);">
          <h3 style="font-size: 16px; font-weight: 600; color: var(--tertiary);">Danger Zone</h3>
          <p style="font-size: 13px; color: var(--on-surface-variant);">Permanently delete all database notes and reset all preferences.</p>
          
          <div style="margin-top: var(--spacing-xs);">
            <button id="settings-reset-btn" class="btn btn--danger">
              <span class="material-symbols-outlined" style="font-size:18px;">delete_forever</span> Reset Workspace
            </button>
          </div>
        </div>
      </div>
    `;

    // Hook events
    const themeSelect = document.getElementById('settings-theme-select');
    themeSelect.addEventListener('change', (e) => {
      onThemeChangeCallback(e.target.value);
    });

    const exportBtn = document.getElementById('settings-export-btn');
    exportBtn.addEventListener('click', () => {
      onExportBackupCallback();
    });

    const importTrigger = document.getElementById('settings-import-trigger');
    const importFile = document.getElementById('settings-import-file');
    importTrigger.addEventListener('click', () => {
      importFile.click();
    });
    importFile.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        onImportBackupCallback(e.target.files[0]);
      }
    });

    const resetBtn = document.getElementById('settings-reset-btn');
    resetBtn.addEventListener('click', () => {
      onResetWorkspaceCallback();
    });

    const settingsSignOutBtn = document.getElementById('settings-signout-btn');
    if (settingsSignOutBtn) {
      settingsSignOutBtn.addEventListener('click', () => {
        onSignOutCallback();
      });
    }

    return;
  }

  // Update breadcrumb navigation
  const breadcrumbActive = document.querySelector('.editor-panel__breadcrumbs .active');
  if (breadcrumbActive) {
    breadcrumbActive.textContent = note ? truncate(note.title, 20) : 'No Note';
  }

  // Toggle header actions visibility
  const headerActions = document.querySelector('.editor-panel__actions');
  if (headerActions) {
    headerActions.style.visibility = note ? 'visible' : 'hidden';
  }

  // Toggle footer visibility
  const editorFooter = document.querySelector('.editor-panel__footer');
  if (editorFooter) {
    editorFooter.style.visibility = note ? 'visible' : 'hidden';
  }
  
  if (!note) {
    editorScrollArea.innerHTML = `
      <div class="empty-state">
        <span class="material-symbols-outlined empty-state__icon">description</span>
        <h2 class="empty-state__title">No note selected</h2>
        <p class="empty-state__desc">Choose a note from the sidebar list or create a new one to begin editing.</p>
        <button class="btn btn--primary btn--new-note-empty">
          <span class="material-symbols-outlined">add</span> Create Note
        </button>
      </div>
    `;
    
    const newNoteEmptyBtn = editorScrollArea.querySelector('.btn--new-note-empty');
    if (newNoteEmptyBtn) {
      newNoteEmptyBtn.addEventListener('click', () => {
        const createBtn = document.getElementById('new-note-btn');
        if (createBtn) createBtn.click();
      });
    }
    return;
  }
  
  editorScrollArea.innerHTML = `
    <div class="editor-panel__content-wrapper">
      <input type="text" class="note-title-input" value="${note.title}" placeholder="Untitled Note">
      <div class="tag-list">
        <span class="tag">#personal</span>
        <button class="tag tag--add">+ Add tag</button>
      </div>
      <textarea class="note-body-textarea" placeholder="Start writing your note here...">${note.body}</textarea>
    </div>
  `;
  
  // Wire up inline input listeners
  const titleInput = editorScrollArea.querySelector('.note-title-input');
  const bodyTextarea = editorScrollArea.querySelector('.note-body-textarea');
  
  const handleInputChange = () => {
    onNoteChangeCallback(note.id, {
      title: titleInput.value,
      body: bodyTextarea.value
    });
  };
  
  titleInput.addEventListener('input', handleInputChange);
  bodyTextarea.addEventListener('input', handleInputChange);

  // Sync state bar info
  updateEditorFooterStats(note);
}

/**
 * Updates word count and saved time status in the footer bar.
 * @param {object} note
 */
export function updateEditorFooterStats(note) {
  const statsSpan = document.getElementById('note-stats-info');
  const wordsCount = note.body ? note.body.trim().split(/\s+/).filter(Boolean).length : 0;
  const timeStr = formatDate(note.updatedAt);
  if (statsSpan) {
    statsSpan.innerHTML = `Last saved: ${timeStr} <span class="text-outline-variant">|</span> ${wordsCount} words`;
  }
  
  // Update topbar pin button toggle styling
  const topPinBtn = document.getElementById('topbar-pin-btn');
  if (topPinBtn) {
    const pinIcon = topPinBtn.querySelector('.material-symbols-outlined');
    const pinText = topPinBtn.querySelector('.font-label-sm');
    if (note.pinned) {
      topPinBtn.classList.add('note-card__pin-icon--active');
      pinIcon.style.fontVariationSettings = "'FILL' 1";
      if (pinText) pinText.textContent = 'Pinned';
    } else {
      topPinBtn.classList.remove('note-card__pin-icon--active');
      pinIcon.style.fontVariationSettings = "'FILL' 0";
      if (pinText) pinText.textContent = 'Pin';
    }
  }
}

/**
 * Renders the user profile card and logout triggers dynamically inside the sidebar footer.
 * @param {object} user - Supabase user object
 * @param {Function} onSettingsClick - Callback to display settings panel
 * @param {Function} onSignOutClick - Callback to trigger signout
 */
export function renderSidebarFooter(user, onSettingsClick, onSignOutClick) {
  const footer = document.querySelector('.sidebar__footer');
  if (!footer) return;
  
  if (!user) {
    footer.innerHTML = `
      <button id="sidebar-settings-btn" class="btn btn--secondary" style="width: 100%; justify-content: flex-start; gap: var(--spacing-sm);" title="Workspace settings">
        <span class="material-symbols-outlined">settings</span>
        Workspace Settings
      </button>
    `;
    return;
  }
  
  const email = user.email || '';
  const meta = user.user_metadata || {};
  const fullName = meta.full_name || email.split('@')[0];
  const initial = (fullName ? fullName.charAt(0) : '?').toUpperCase();
  
  footer.innerHTML = `
    <div class="profile-info" style="display: flex; align-items: center; gap: var(--spacing-sm); flex: 1; min-width: 0;" title="Open settings">
      <div class="profile-avatar" style="width: 32px; height: 32px; border-radius: var(--radius-full); background-color: var(--primary-container); color: var(--on-primary); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; flex-shrink: 0;">${initial}</div>
      <div class="profile-details" style="display: flex; flex-direction: column; min-width: 0; flex: 1;">
        <span class="profile-name" style="font-size: 12px; font-weight: 600; color: var(--on-surface); line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${fullName}</span>
        <span class="profile-tier" style="font-size: 10px; color: var(--on-surface-variant); line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${email}</span>
      </div>
    </div>
    <button id="footer-signout-btn" class="btn--icon btn--icon-danger" title="Sign Out" style="flex-shrink: 0; padding: 4px;">
      <span class="material-symbols-outlined" style="font-size: 20px;">logout</span>
    </button>
  `;
  
  // Bind click listeners
  const profileInfo = footer.querySelector('.profile-info');
  if (profileInfo) {
    profileInfo.addEventListener('click', onSettingsClick);
  }
  
  const footerSignOutBtn = document.getElementById('footer-signout-btn');
  if (footerSignOutBtn) {
    footerSignOutBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Avoid triggering open settings click
      onSignOutClick();
    });
  }
}

/**
 * Displays the delete confirmation dialog overlay.
 * @param {Function} onConfirm - Callback on confirmation
 */
export function showDeleteConfirmationModal(onConfirm) {
  if (!deleteModal) return;
  
  deleteModal.classList.add('modal-overlay--show');
  
  const handleConfirm = () => {
    onConfirm();
    hideDeleteConfirmationModal();
    cleanup();
  };
  
  const handleCancel = () => {
    hideDeleteConfirmationModal();
    cleanup();
  };
  
  const cleanup = () => {
    deleteConfirmBtn.removeEventListener('click', handleConfirm);
    deleteCancelBtn.removeEventListener('click', handleCancel);
  };
  
  deleteConfirmBtn.addEventListener('click', handleConfirm);
  deleteCancelBtn.addEventListener('click', handleCancel);
}

export function hideDeleteConfirmationModal() {
  if (deleteModal) {
    deleteModal.classList.remove('modal-overlay--show');
  }
}

/**
 * Toast Notification system.
 * @param {string} message
 * @param {Function|null} onUndo - Callback if Undo is clicked
 */
let toastTimeoutId = null;
export function showToast(message, onUndo = null) {
  if (!toastContainer || !toastMessage || !toastUndoBtn) return;
  
  clearTimeout(toastTimeoutId);
  
  toastMessage.textContent = message;
  
  if (onUndo) {
    toastUndoBtn.style.display = 'inline-block';
    
    const handleUndo = () => {
      onUndo();
      hideToast();
    };
    
    // Replace listener
    const newUndoBtn = toastUndoBtn.cloneNode(true);
    toastUndoBtn.parentNode.replaceChild(newUndoBtn, toastUndoBtn);
    toastUndoBtn = newUndoBtn;
    toastUndoBtn.addEventListener('click', handleUndo);
  } else {
    toastUndoBtn.style.display = 'none';
  }
  
  toastContainer.classList.add('toast-container--show');
  
  // Auto dismiss toast after 5 seconds
  toastTimeoutId = setTimeout(() => {
    hideToast();
  }, 5000);
}

export function hideToast() {
  if (toastContainer) {
    toastContainer.classList.remove('toast-container--show');
  }
}

/**
 * Controls responsive navigation view (mobile toggle).
 * @param {boolean} showEditor
 */
export function setMobileView(showEditor) {
  if (showEditor) {
    document.body.classList.add('show-editor');
  } else {
    document.body.classList.remove('show-editor');
  }
}
