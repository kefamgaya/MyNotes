NoteFlow — Project Architecture Document

Written from the perspective of an experienced software developer building a clean, maintainable vanilla JS notes app for a beginner audience.


PROJECT STRUCTURE

The project lives in a single folder. Here is how the files are organized:

noteflow/
index.html
css/
  reset.css
  layout.css
  components.css
  themes.css
js/
  app.js
  store.js
  notes.js
  ui.js
  search.js
  sort.js
  drag.js
  utils.js
assets/
  icons/


Each file has one job. This is the most important architectural decision. When something breaks, you know exactly which file to open.


FILE RESPONSIBILITIES

index.html is the entry point and the only HTML file. It defines the skeleton of the app — the sidebar, the notes grid, the editor panel, and the modals. It loads all CSS files in the head and all JS files at the bottom of the body in the correct order. It contains no logic. Just structure.

reset.css removes all browser default styles so the app looks consistent across Chrome, Firefox, and Safari. This is always the first CSS file loaded.

layout.css handles the overall page layout. The app uses a two-panel layout. On the left is the sidebar with the search bar, sort controls, and the list of note cards. On the right is the editor panel where the selected note is opened and edited. On mobile, these two panels stack vertically and a back button is shown when a note is open.

components.css styles individual UI elements — note cards, buttons, the search input, the confirmation modal, the empty state, the toast notification. Each component has its own clearly named CSS class following BEM naming convention, for example .note-card, .note-card__title, .note-card__preview, .note-card--pinned.

themes.css holds CSS custom properties, also called CSS variables, for colors, fonts, spacing, and border radius. All other CSS files reference these variables instead of hardcoded values. This makes it trivial to change the visual style of the entire app by editing one file.

app.js is the main entry point for JavaScript. It runs when the page loads. It calls store.js to load saved notes from localStorage, calls ui.js to render the initial state, and wires up all event listeners — the new note button, the search input, the sort dropdown. Think of it as the conductor that connects everything else together.

store.js is the single source of truth for data. It is responsible for reading and writing notes to localStorage. It exposes functions like getAllNotes, getNoteById, saveNote, deleteNote, and updateNoteOrder. No other file touches localStorage directly. If you ever want to swap localStorage for IndexedDB or a real API later, you only change this one file.

notes.js contains the business logic for notes. It handles creating a new note object with a generated ID and timestamps, updating a note's body and title, toggling the pinned state, and computing what the preview text should be. It works with plain JavaScript objects and knows nothing about the DOM or localStorage. It is pure logic.

ui.js is responsible for everything you see. It takes data from store.js and renders it into the DOM. It has functions like renderNoteList which loops over all notes and creates card elements, renderEditor which populates the right panel with the selected note's content, renderEmptyState which shows the placeholder when there are no notes, and showToast which displays temporary feedback messages at the bottom of the screen. This file is never called directly by the user — it is always called by app.js or event handlers in response to something happening.

search.js handles the real-time search feature. It listens for input on the search field, takes the current value, filters the notes array by checking if the title or body contains the search string (case insensitive), and calls ui.js to re-render the note list with only the matching results.

sort.js handles sorting. It exposes a sortNotes function that accepts an array of notes and a sort strategy — either by date created, date updated, title alphabetically, or custom manual order. The result is a sorted array that ui.js can render. The current sort preference is also saved to localStorage so it persists between sessions.

drag.js handles the drag and drop reordering of note cards. It uses the native HTML5 Drag and Drop API. When the user drops a card in a new position, drag.js calculates the new order of all notes, updates the order field on each note object, and calls store.js to save the new arrangement. It also calls ui.js to re-render the list in the new order.

utils.js contains small reusable helper functions used across the codebase. This includes generateId which creates a unique string ID using Math.random and Date.now, formatDate which turns an ISO timestamp into a human readable string like "May 21, 2026", debounce which wraps a function so it only fires after the user has stopped typing for a given delay (used for auto-save), and truncate which shortens a long string to a given character limit for card previews.


DATA FLOW

When the app loads, app.js runs. It calls store.getAllNotes which reads the notes array from localStorage and parses the JSON. That array is passed to ui.renderNoteList which loops through and creates a DOM card for each note. The user sees their notes.

When the user types in the search bar, the input event fires, search.js filters the in-memory notes array, and ui.renderNoteList is called again with the filtered subset. localStorage is never touched during search. Only the display changes.

When the user clicks New Note, app.js calls notes.createNote to get a fresh note object, then calls store.saveNote to write it to localStorage, then calls ui.renderNoteList to add the new card to the list, and then calls ui.renderEditor to open the new note immediately in the editor panel.

When the user types inside the editor, a debounced function fires 500 milliseconds after they stop typing. It reads the current title and body values from the editor DOM elements, calls notes.updateNote to produce an updated note object with a new updatedAt timestamp, and calls store.saveNote to write it to localStorage. No save button required.

When the user clicks the delete icon, ui.js shows a confirmation modal. If the user confirms, store.deleteNote is called to remove the note from localStorage. Then ui.renderNoteList re-renders the list without that note. If the deleted note was open in the editor, ui.js clears the editor panel and shows the empty state.

When the user drags a card to a new position, drag.js updates the order property on all note objects and calls store.saveNote in a loop for each affected note, then re-renders the list.


STATE MANAGEMENT

There is no external state management library. The app has two pieces of state. Persistent state lives in localStorage and is always the source of truth for saved data. Ephemeral state — like which note is currently selected, what the current search query is, and what sort mode is active — lives in simple JavaScript variables declared at the top of app.js. These are reset on every page load, which is intentional and correct for a beginner project.


LOCALSTORAGE SCHEMA

All notes are stored under a single key called "noteflow_notes" as a JSON stringified array. The sort preference is stored under "noteflow_sort" as a plain string. There is nothing else in localStorage. The store.js file handles all serialization and deserialization.

A single note object looks like this in memory:

id — a unique string, never changes after creation
title — string, defaults to "Untitled Note" if empty
body — string, the full note content
createdAt — ISO 8601 date string, set once on creation
updatedAt — ISO 8601 date string, updated on every save
pinned — boolean, false by default
order — integer, used for manual drag reordering


ERROR HANDLING

store.js wraps all localStorage reads and writes in try/catch blocks. If localStorage is unavailable (for example in a private browsing session with storage blocked), the app shows a banner warning the user that notes will not be saved. The app still functions for the current session using the in-memory array.

If the stored JSON is corrupted and fails to parse, store.js returns an empty array and logs the error to the console rather than crashing the app.


SCALABILITY NOTES

This architecture makes it straightforward to add features later. To add markdown rendering you only modify ui.js and notes.js. To add folders or tags you add a new field to the note object in notes.js and update the store and UI accordingly. To migrate from localStorage to a real API you rewrite only store.js and the rest of the app does not change. To convert the project to React you can use the same store.js and notes.js files almost untouched since they have no DOM dependencies.

