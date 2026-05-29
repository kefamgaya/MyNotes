/* drag.js */

/**
 * Initializes HTML5 Drag and Drop on note cards within a container.
 * Dragging is only initiated from the .note-card__drag-handle element.
 * @param {HTMLElement} container - The note list container element
 * @param {Function} onOrderChange - Callback invoked with the new array of note IDs
 */
export function initDragAndDrop(container, onOrderChange) {
  let dragSrcEl = null;
  let isDragHandleActive = false;

  function handleMouseDown(e) {
    // Only allow drag if the handle (or its child) was pressed
    const handle = e.target.closest('.note-card__drag-handle');
    if (handle) {
      isDragHandleActive = true;
    } else {
      isDragHandleActive = false;
    }
  }

  function handleDragStart(e) {
    if (!isDragHandleActive) {
      e.preventDefault();
      return;
    }
    this.classList.add('dragging');
    dragSrcEl = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.id);

    // Set a semi-transparent drag image
    if (e.dataTransfer.setDragImage) {
      const rect = this.getBoundingClientRect();
      e.dataTransfer.setDragImage(this, rect.width / 2, 20);
    }
  }

  function handleDragOver(e) {
    if (e.preventDefault) {
      e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
  }

  function handleDragEnter(e) {
    if (dragSrcEl !== this) {
      this.classList.add('drag-over');
    }
  }

  function handleDragLeave(e) {
    this.classList.remove('drag-over');
  }

  function handleDrop(e) {
    e.stopPropagation();
    e.preventDefault();
    
    if (dragSrcEl !== this) {
      const draggedId = e.dataTransfer.getData('text/plain');
      const targetId = this.dataset.id;
      
      const cards = Array.from(container.children);
      const draggedIndex = cards.findIndex(c => c.dataset.id === draggedId);
      const targetIndex = cards.findIndex(c => c.dataset.id === targetId);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        // Move element in the DOM
        if (draggedIndex < targetIndex) {
          container.insertBefore(dragSrcEl, this.nextSibling);
        } else {
          container.insertBefore(dragSrcEl, this);
        }
        
        // Extract new order list from DOM
        const newOrderedIds = Array.from(container.children)
          .map(c => c.dataset.id)
          .filter(Boolean);
          
        onOrderChange(newOrderedIds);
      }
    }
    return false;
  }

  function handleDragEnd(e) {
    this.classList.remove('dragging');
    isDragHandleActive = false;
    Array.from(container.children).forEach(card => {
      card.classList.remove('drag-over');
    });
  }

  /**
   * Binds drag & drop listeners to a specific element.
   * @param {HTMLElement} card
   */
  function bindCardEvents(card) {
    card.setAttribute('draggable', 'true');
    card.addEventListener('mousedown', handleMouseDown, false);
    card.addEventListener('dragstart', handleDragStart, false);
    card.addEventListener('dragover', handleDragOver, false);
    card.addEventListener('dragenter', handleDragEnter, false);
    card.addEventListener('dragleave', handleDragLeave, false);
    card.addEventListener('drop', handleDrop, false);
    card.addEventListener('dragend', handleDragEnd, false);
  }

  // Observe container for dynamically added note cards to bind events to them
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('note-card')) {
          bindCardEvents(node);
        }
      });
    });
  });

  observer.observe(container, { childList: true });

  // Bind initial children
  Array.from(container.children).forEach(card => {
    if (card.classList.contains('note-card')) {
      bindCardEvents(card);
    }
  });
}
