# 📝 NoteFlow — Product Requirements Document

## Overview

A lightweight, browser-based note-taking app built for beginners. No account, no server, no complexity — just open and start writing. All data lives in the browser's `localStorage`.

---

## Core Principles

- **Zero friction** — No login, no setup, open and go
- **Offline-first** — Works entirely without internet
- **Beginner-friendly** — Clean UI, obvious actions, no hidden features
- **Persistent** — Notes survive page refreshes and browser restarts (via localStorage)

---

## Features

### 1. Create a Note
- A visible **"New Note"** button always accessible
- Each note has two fields: a **Title** and a **Body**
- Title defaults to *"Untitled Note"* if left blank
- Note is auto-saved to localStorage as the user types (debounced ~500ms)
- Each note gets a unique ID and a **created timestamp**

### 2. View Notes
- Notes displayed as **cards** in a grid or list layout
- Each card shows: title, a short preview of the body (~100 chars), and the last-edited date
- Empty state shown when no notes exist — with a prompt to create the first one

### 3. Edit a Note
- Clicking a note card opens it in an **edit view** (same page or modal)
- Title and body are both editable inline
- Changes auto-save to localStorage — no "Save" button needed
- A **last edited** timestamp updates on every change

### 4. Delete a Note
- Each note card has a **Delete** button (trash icon)
- A **confirmation prompt** appears before permanent deletion ("Are you sure?")
- Deletion removes the note from localStorage immediately and updates the UI

### 5. Arrange / Organize Notes
- **Sort options:** by Last Edited, Date Created, or Title (A–Z)
- **Drag to reorder** — user can manually drag cards to their preferred order (custom order saved to localStorage)
- Optional: **Pin a note** to keep it at the top

### 6. Search Notes
- A **search bar** at the top filters notes in real-time
- Searches across both title and body content
- No results state shown if nothing matches

---

## Data Model (localStorage)

Each note stored as a JSON object:

```json
{
  "id": "uuid-1234",
  "title": "My First Note",
  "body": "This is the content of the note.",
  "createdAt": "2026-05-21T10:00:00Z",
  "updatedAt": "2026-05-21T10:30:00Z",
  "pinned": false,
  "order": 0
}
```

All notes stored as an array under a single key, e.g. `localStorage.setItem("notes", JSON.stringify([...]))`.

---

## UX Rules

| Rule | Detail |
|---|---|
| Auto-save | Saves 500ms after the user stops typing |
| No broken states | Empty title → fallback to "Untitled Note" |
| Undo delete | Optional: brief toast with "Undo" (5s window) |
| Mobile friendly | Works on phone screens, tap targets ≥ 44px |
| No data loss | Warn user if localStorage is full or unavailable |

---

## Out of Scope (for v1)

- User accounts / login
- Cloud sync or database
- Rich text / markdown formatting
- Note sharing
- Folders or tags
- Import / export

These can be **v2 features** once the core works well.

---

## Tech Suggestions (Beginner-Friendly)

| Option | Stack |
|---|---|
| Simplest | Vanilla HTML + CSS + JavaScript |
| Component-based | React (Vite) |
| Styled fast | React + Tailwind CSS |

Since this is a beginner project, **vanilla JS** is the best starting point — no build tools, no dependencies, just one HTML file. Once comfortable, you can migrate to React.
