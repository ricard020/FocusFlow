// ==========================================
// DATA LAYER - LocalStorage + JSON
// ==========================================
const STORAGE_KEY = 'kanban_tasks_data';

const COLUMNS = [
    { id: 'todo', name: 'To Do' },
    { id: 'in-progress', name: 'In Progress' },
    { id: 'done', name: 'Done' }
];

// Default tasks (only used on first load)
const DEFAULT_TASKS = [];

function generateId() {
    return 'task_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
}

function loadTasks() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Error parsing stored tasks:', e);
        }
    }
    // First load: use defaults and save them
    saveTasks(DEFAULT_TASKS);
    return [...DEFAULT_TASKS];
}

function saveTasks(tasks) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// ==========================================
// CRUD OPERATIONS
// ==========================================
let tasks = loadTasks();

function createTask(title, description, column) {
    const task = {
        id: generateId(),
        title: title.trim(),
        description: description.trim(),
        column: column,
        createdAt: new Date().toISOString()
    };
    tasks.push(task);
    saveTasks(tasks);
    renderBoard();
    showToast('Tarea creada exitosamente', 'check_circle', '#1da0d8');
    return task;
}

function readTask(id) {
    return tasks.find(t => t.id === id);
}

function updateTask(id, updates) {
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return null;
    tasks[index] = { ...tasks[index], ...updates };
    saveTasks(tasks);
    renderBoard();
    showToast('Tarea actualizada', 'edit', '#1da0d8');
    return tasks[index];
}

function deleteTask(id) {
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return false;
    tasks.splice(index, 1);
    saveTasks(tasks);
    renderBoard();
    showToast('Tarea eliminada', 'delete', '#ef4444');
    return true;
}

function moveTask(id, newColumn) {
    const task = readTask(id);
    if (task && task.column !== newColumn) {
        updateTask(id, { column: newColumn });
    }
}

function getTasksByColumn(columnId) {
    return tasks.filter(t => t.column === columnId);
}

// ==========================================
// RENDERING
// ==========================================
function formatDate(isoString) {
    const date = new Date(isoString);
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${months[date.getMonth()]} ${date.getDate().toString().padStart(2, '0')}, ${date.getFullYear()}`;
}

function createCardHTML(task) {
    return `
        <div class="group bg-card-light dark:bg-card-dark p-3 rounded-md shadow-card hover:shadow-card-hover transition-all duration-200 cursor-grab border border-transparent hover:border-primary/30 card-enter"
             draggable="true"
             data-task-id="${task.id}"
             ondragstart="onDragStart(event)"
             ondragend="onDragEnd(event)">
            <div class="flex items-start justify-between gap-2 mb-1">
                <h4 class="text-[#111818] dark:text-gray-100 font-bold text-base leading-snug flex-1">${escapeHTML(task.title)}</h4>
                <div class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onclick="openEditModal('${task.id}')" title="Editar"
                        class="text-gray-400 hover:text-primary p-1 rounded hover:bg-primary/10 transition-colors">
                        <span class="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button onclick="openDeleteModal('${task.id}')" title="Eliminar"
                        class="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <span class="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                </div>
            </div>
            ${task.description ? `<p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">${escapeHTML(task.description)}</p>` : '<div class="mb-2"></div>'}
            <div class="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-3 mt-1">
                <div class="flex items-center gap-1.5 text-gray-400 text-xs font-medium">
                    <span class="material-symbols-outlined text-[16px]">calendar_today</span>
                    <span>${formatDate(task.createdAt)}</span>
                </div>
            </div>
        </div>
    `;
}

function createColumnHTML(column) {
    const columnTasks = getTasksByColumn(column.id);
    const cardsHTML = columnTasks.map(t => createCardHTML(t)).join('');
    const doneClass = column.id === 'done' ? 'opacity-80 hover:opacity-100 transition-opacity' : '';

    return `
        <div class="flex flex-col w-[85vw] max-w-[340px] lg:w-0 lg:flex-1 lg:max-w-none shrink-0 h-full max-h-full snap-center bg-column-light dark:bg-column-dark rounded-lg border border-transparent dark:border-white/5 ${doneClass}"
             data-column-id="${column.id}"
             ondragover="onDragOver(event)"
             ondragleave="onDragLeave(event)"
             ondrop="onDrop(event)">
            <!-- Column Header -->
            <div class="p-4 flex items-center justify-between sticky top-0">
                <div class="flex items-center gap-2">
                    <h3 class="font-bold text-[#111818] dark:text-white text-base">${column.name}</h3>
                    <span class="column-count bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold px-2 py-0.5 rounded-full">${columnTasks.length}</span>
                </div>
            </div>
            <!-- Column Cards Container -->
            <div class="flex-1 overflow-y-auto px-3 pb-3 flex flex-col gap-3 min-h-[60px]"
                 data-cards-container="${column.id}">
                ${cardsHTML}
            </div>
            <!-- Column Footer (Add Card) -->
            <div class="p-3 mt-auto">
                <button onclick="openCreateModal('${column.id}')"
                    class="w-full flex items-center justify-center gap-2 py-2.5 rounded-md border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-primary hover:text-primary hover:bg-white dark:hover:bg-[#233434] transition-all text-sm font-semibold group">
                    <span class="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">add</span>
                    Agregar Tarea
                </button>
            </div>
        </div>
    `;
}

function renderBoard() {
    const board = document.getElementById('board');
    board.innerHTML = COLUMNS.map(col => createColumnHTML(col)).join('');
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ==========================================
// MODAL MANAGEMENT
// ==========================================
let isEditing = false;

function openCreateModal(columnId) {
    isEditing = false;
    document.getElementById('modal-title').textContent = 'Nueva Tarea';
    document.getElementById('btn-submit').textContent = 'Crear Tarea';
    document.getElementById('form-task-id').value = '';
    document.getElementById('form-task-column').value = columnId;
    document.getElementById('form-title').value = '';
    document.getElementById('form-description').value = '';
    document.getElementById('column-selector-wrapper').classList.add('hidden');
    document.getElementById('task-modal').classList.remove('hidden');
    setTimeout(() => document.getElementById('form-title').focus(), 100);
}

function openEditModal(taskId) {
    const task = readTask(taskId);
    if (!task) return;
    isEditing = true;
    document.getElementById('modal-title').textContent = 'Editar Tarea';
    document.getElementById('btn-submit').textContent = 'Guardar Cambios';
    document.getElementById('form-task-id').value = task.id;
    document.getElementById('form-task-column').value = task.column;
    document.getElementById('form-title').value = task.title;
    document.getElementById('form-description').value = task.description;
    document.getElementById('form-column-select').value = task.column;
    document.getElementById('column-selector-wrapper').classList.remove('hidden');
    document.getElementById('task-modal').classList.remove('hidden');
    setTimeout(() => document.getElementById('form-title').focus(), 100);
}

function closeModal() {
    document.getElementById('task-modal').classList.add('hidden');
    document.getElementById('task-form').reset();
}

function handleFormSubmit(e) {
    e.preventDefault();
    const title = document.getElementById('form-title').value.trim();
    const description = document.getElementById('form-description').value.trim();
    const taskId = document.getElementById('form-task-id').value;

    if (!title) return;

    if (isEditing && taskId) {
        const newColumn = document.getElementById('form-column-select').value;
        updateTask(taskId, { title, description, column: newColumn });
    } else {
        const column = document.getElementById('form-task-column').value;
        createTask(title, description, column);
    }
    closeModal();
}

function openDeleteModal(taskId) {
    const task = readTask(taskId);
    if (!task) return;
    document.getElementById('delete-task-id').value = taskId;
    document.getElementById('delete-task-name').textContent = `"${task.title}" será eliminada permanentemente.`;
    document.getElementById('delete-modal').classList.remove('hidden');
}

function closeDeleteModal() {
    document.getElementById('delete-modal').classList.add('hidden');
}

function confirmDelete() {
    const taskId = document.getElementById('delete-task-id').value;
    if (taskId) {
        deleteTask(taskId);
    }
    closeDeleteModal();
}

// ==========================================
// DRAG AND DROP
// ==========================================
let draggedTaskId = null;

function onDragStart(e) {
    draggedTaskId = e.currentTarget.dataset.taskId;
    e.currentTarget.classList.add('card-dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedTaskId);
    // Add a slight delay to show the visual feedback
    setTimeout(() => {
        document.querySelectorAll('[data-column-id]').forEach(col => {
            if (col.querySelector(`[data-task-id="${draggedTaskId}"]`) === null) {
                col.classList.add('transition-colors', 'duration-200');
            }
        });
    }, 0);
}

function onDragEnd(e) {
    e.currentTarget.classList.remove('card-dragging');
    draggedTaskId = null;
    document.querySelectorAll('[data-column-id]').forEach(col => {
        col.classList.remove('column-drag-over');
    });
}

function onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const column = e.currentTarget.closest('[data-column-id]');
    if (column) {
        column.classList.add('column-drag-over');
    }
}

function onDragLeave(e) {
    const column = e.currentTarget.closest('[data-column-id]');
    // Only remove if we're actually leaving the column (not entering a child)
    if (column && !column.contains(e.relatedTarget)) {
        column.classList.remove('column-drag-over');
    }
}

function onDrop(e) {
    e.preventDefault();
    const column = e.currentTarget.closest('[data-column-id]');
    if (!column || !draggedTaskId) return;

    const newColumnId = column.dataset.columnId;
    const task = readTask(draggedTaskId);

    if (task && task.column !== newColumnId) {
        // Suppress individual toast for drag moves
        const index = tasks.findIndex(t => t.id === draggedTaskId);
        if (index !== -1) {
            tasks[index].column = newColumnId;
            saveTasks(tasks);
            renderBoard();
            showToast(`Tarea movida a "${COLUMNS.find(c => c.id === newColumnId).name}"`, 'drag_indicator', '#1da0d8');
        }
    }

    column.classList.remove('column-drag-over');
    draggedTaskId = null;
}

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================
function showToast(message, icon = 'info', color = '#1da0d8') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast flex items-center gap-3 bg-white dark:bg-card-dark px-4 py-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 text-sm font-medium pointer-events-none';
    toast.innerHTML = `
        <span class="material-symbols-outlined text-[20px]" style="color:${color}">${icon}</span>
        <span class="text-[#111818] dark:text-white">${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 2600);
}

// ==========================================
// ==========================================
// UI EXTRAS (THEME & INFO)
// ==========================================
function toggleTheme() {
    const html = document.documentElement;
    const icon = document.getElementById('theme-icon');
    if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        if(icon) icon.textContent = 'dark_mode';
        localStorage.setItem('focusflow_theme', 'light');
    } else {
        html.classList.add('dark');
        if(icon) icon.textContent = 'light_mode';
        localStorage.setItem('focusflow_theme', 'dark');
    }
}

function initTheme() {
    const savedTheme = localStorage.getItem('focusflow_theme');
    const html = document.documentElement;
    const icon = document.getElementById('theme-icon');
    
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        html.classList.add('dark');
        if(icon) icon.textContent = 'light_mode';
    } else {
        html.classList.remove('dark');
        if(icon) icon.textContent = 'dark_mode';
    }
}

function openInfoModal() {
    document.getElementById('info-modal').classList.remove('hidden');
}

function closeInfoModal() {
    document.getElementById('info-modal').classList.add('hidden');
}

// ==========================================
// KEYBOARD SHORTCUTS
// ==========================================
document.addEventListener('keydown', function (e) {
    // Escape to close modals
    if (e.key === 'Escape') {
        closeModal();
        closeDeleteModal();
        closeInfoModal();
    }
});

// ==========================================
// INIT
// ==========================================
initTheme();
renderBoard();
