# 📱 NoteFlow — UI Generation Prompts

This document details the layout, structure, and design specifications for all the views, states, and responsive panels of **NoteFlow**. These details are formatted as structured UI prompts optimized for **Google Stitch** (or similar UI generators).

---

## 🎨 Design System & Theme Foundation

To ensure all generated screens maintain visual cohesion, prepend or include these style guidelines in every prompt:

* **Theme:** Clean, modern "soft-minimalist" flat-tactile design.
* **Palette:**
  * **Backgrounds:** Off-white (`#F8F9FA`) for light mode or deep slate (`#0F172A`) for dark mode.
  * **Surfaces (Cards/Panels):** Pure white (`#FFFFFF`) or dark slate (`#1E293B`).
  * **Text:** Dark charcoal (`#1F2937`) or cool gray (`#F3F4F6`).
  * **Accents:** Active/Primary: Indigo (`#6366F1`), Success/Pin: Emerald (`#10B981`), Delete/Warning: Rose (`#F43F5E`).
* **Typography:** Clean sans-serif (e.g., *Inter* or *Outfit*), using clear hierarchical weights (Regular 400, Medium 500, Semi-Bold 600).
* **Interactions:** Subtle scale transitions (`transform: scale(0.98)` on click), soft hover backgrounds, and clear border highlights for focus states.

---

## 🖥️ Screen 1: Desktop Main Interface (Split-Panel View)

### 📌 Prompt for Google Stitch
> **Task:** Generate a desktop web dashboard layout for a note-taking application named **NoteFlow** using a two-column split-panel design with a clean, flat-tactile design language.
>
> **Layout & Dimensions:**
> * **Container:** Full viewport height (`100vh`), fixed width (`100%`), split vertically.
> * **Left Panel (Sidebar - width: 360px):**
>   * Header with the logo/title "NoteFlow" in a bold modern sans-serif (`20px`, Semi-Bold), alongside a "New Note" action button (accent background, white text, plus icon + "New Note" text).
>   * A search input below the header with a search icon prefix and a placeholder "Search notes...".
>   * A sort bar with a dropdown menu displaying "Sort by: Last Edited", "Date Created", and "Title".
>   * A vertically scrollable list of note cards.
> * **Right Panel (Editor - remaining width):**
>   * A clean, distraction-free workspace.
>   * Header area with a "Pin Note" (emerald outline icon) and a "Delete Note" (rose outline icon).
>   * Note Title Input: Large, borderless text input field (`32px`, bold) with placeholder "Untitled Note".
>   * Note Body Textarea: Borderless scrollable body text input (`16px`, regular line-height `1.6`) with placeholder "Start writing your note here...".
>   * Status Bar (Footer): Small muted text showing "Last saved: Today at 10:45 AM" or "524 words".
>
> **Interactive States & Components:**
> * **Active Note Card:** Indigo left border accent (`4px`), slightly darker background highlight, elevated appearance.
> * **Inactive Note Cards:** Soft light-gray border, showing a note title (`16px`, Medium), a 2-line snippet preview (`14px`, muted gray), a date badge ("May 21"), and an optional pin indicator icon in the top right.

---

## 📱 Screen 2: Mobile List / Sidebar View (State A)

### 📌 Prompt for Google Stitch
> **Task:** Generate a mobile-responsive list view for the **NoteFlow** note-taking app, designed for mobile screen widths (375px to 420px).
>
> **Layout & Components:**
> * **Header Bar (sticky, height: 60px):**
>   * Left: App Title "NoteFlow" (`22px`, Extra Bold, Indigo color).
>   * Right: A floating action button (FAB) or a highly visible square button with a plus icon (`+`) for creating a new note.
> * **Search & Filter Row:**
>   * Full-width search input field with rounded corners (`12px`), light background, search magnifying glass icon, and "Search notes..." placeholder.
>   * A compact, horizontal segment pill selector for sorting: "Recent" (active/pill styling), "Created", and "A-Z".
> * **Notes Feed:**
>   * A vertically scrolling list of cards, each occupying 100% width with vertical gap spacing (`12px`).
>   * Each card features:
>     * Title (`16px`, Semi-Bold, dark grey).
>     * Truncated preview text of the body (max 2 lines, `14px`, cool gray).
>     * Bottom row: Last edited date (e.g., "Yesterday") and a subtle tag or pin icon if the note is pinned.
> * **Empty State (Conditional UI):**
>   * If no notes exist, show a centered layout containing a clean minimalist vector icon/illustration of a notepad, a headline "Create your first note", a description "Tap the button above to get started", and a pointing arrow indicator.

---

## 📱 Screen 3: Mobile Editor View (State B)

### 📌 Prompt for Google Stitch
> **Task:** Generate a mobile editor screen for the **NoteFlow** app. This view replaces the list view when a note is opened on mobile devices.
>
> **Layout & Components:**
> * **Navigation Header Bar (height: 56px, border-bottom):**
>   * Left: "Back" navigation button (left arrow icon `<` + text "Notes" or just a clean icon) to return to the list.
>   * Center: Status text (`12px`, muted) showing "Auto-saved".
>   * Right: A row of icons containing:
>     * Pin button (emerald toggle icon).
>     * Delete button (red trash icon).
> * **Editor Form Panel:**
>   * Full-screen height (excluding header), flex column.
>   * Title Field: Large auto-growing input line (`24px`, bold) with "Untitled Note" placeholder.
>   * Divider: Thin horizontal rule separating the title and body.
>   * Body Text Field: Large textarea or editor container taking up the remaining space (`16px` font size, optimized touch target spacing, comfortable margin/padding of `16px`).
> * **Soft Keyboard Helper Row (Optional Overlay):**
>   * A small horizontal toolbar floating just above the mobile keyboard containing helpful text helpers (e.g., word count, date indicator, undo/redo icons).

---

## 🛠️ Screen 4: Overlay Components & Feedback States

### 📌 Prompt for Google Stitch
> **Task:** Generate UI overlays and interactive feedback components for the **NoteFlow** application. This includes a confirmation dialog and a toast notification.
>
> **Component 1: Delete Confirmation Modal (Overlay):**
> * **Background:** Semi-transparent dark backdrop (`backdrop-filter: blur(4px)`, background color with `50%` opacity).
> * **Dialog Box:** Centered card surface, rounded corners (`16px`), max-width `400px`, layout padding `24px`.
>   * Title: "Delete Note" in bold (`18px`) with a warning icon.
>   * Message: "Are you sure you want to delete this note? This action cannot be undone."
>   * Action Buttons (Right-aligned / stacked on mobile):
>     * "Cancel" button: Neutral background, flat-gray borders.
>     * "Delete" button: Warning accent (Solid Rose Red background, white text).
>
> **Component 2: Toast Notification with Undo Action:**
> * **Container:** Floating bar positioned at the bottom center of the screen, sliding up from the bottom.
> * **Style:** Dark graphite background (`#1F2937`), white text, rounded capsule shape (`32px` or `8px`), soft shadow.
> * **Content:**
>   * Left: Message string "Note deleted".
>   * Right: An action text button labeled "Undo" in bright indigo (`#818CF8`) or emerald text, separated by a thin vertical line.
>   * Dismiss button: Simple "X" icon.
