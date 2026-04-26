'use client';

import { useEffect, useRef, useState } from 'react';

interface Task {
  id: string;
  title: string;
  status: 'pending' | 'completed';
  createdAt: string;
}

type FilterValue = 'all' | 'pending' | 'completed';

const API = '/api/tasks';

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterValue>('all');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Combined filter + search
  const visibleTasks = tasks.filter((t) => {
    const matchesFilter = filter === 'all' || t.status === filter;
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase().trim());
    return matchesFilter && matchesSearch;
  });

  const counts = {
    all: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
  };

  useEffect(() => {
    fetch(API)
      .then((r) => r.json())
      .then((data: Task[]) => setTasks(data))
      .catch(() => setError('Could not load tasks. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  // Auto-focus edit input when editing starts
  useEffect(() => {
    if (editingId) editInputRef.current?.focus();
  }, [editingId]);

  async function addTask() {
    const title = input.trim();
    if (!title) return;
    setAdding(true);
    setError(null);
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error();
      const newTask: Task = await res.json();
      setTasks((prev) => [...prev, newTask]);
      setInput('');
    } catch {
      setError('Could not add task.');
    } finally {
      setAdding(false);
    }
  }

  async function toggleTask(id: string) {
    setTogglingId(id);
    try {
      const res = await fetch(`${API}/${id}/toggle`, { method: 'PATCH' });
      if (!res.ok) throw new Error();
      const updated: Task = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch {
      setError('Could not toggle task status.');
    } finally {
      setTogglingId(null);
    }
  }

  function startEdit(task: Task) {
    setEditingId(task.id);
    setEditValue(task.title);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValue('');
  }

  async function saveEdit(id: string) {
    const title = editValue.trim();
    if (!title) { cancelEdit(); return; }
    const original = tasks.find((t) => t.id === id)?.title;
    if (title === original) { cancelEdit(); return; }

    setSavingId(id);
    setEditingId(null);
    try {
      const res = await fetch(`${API}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error();
      const updated: Task = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch {
      setError('Could not save changes.');
    } finally {
      setSavingId(null);
    }
  }

  async function deleteTask(id: string) {
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error();
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setError('Could not delete task.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Task Manager</h1>
          <p className="mt-2 text-gray-500 text-sm">Stay organized. Stay productive.</p>
        </div>

        {/* Add task */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">New Task</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
              placeholder="What needs to be done?"
              disabled={adding}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-50 transition"
            />
            <button
              onClick={addTask}
              disabled={adding || !input.trim()}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {adding ? <span className="flex items-center gap-2"><Spinner /> Adding…</span> : 'Add'}
            </button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-3 text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {/* Task list card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

          {/* Toolbar: filter tabs + search */}
          <div className="px-4 pt-4 pb-3 border-b border-gray-50 space-y-3">
            {/* Filter tabs */}
            <div className="flex gap-1">
              {(['all', 'pending', 'completed'] as FilterValue[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                    filter === f
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {f} <span className="opacity-70">({counts[f]})</span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks…"
                className="w-full pl-8 pr-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Results header */}
          <div className="px-6 py-3 flex items-center justify-between border-b border-gray-50">
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Tasks</span>
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
              {visibleTasks.length} {visibleTasks.length === 1 ? 'item' : 'items'}
              {search && ` for "${search}"`}
            </span>
          </div>

          {/* List body */}
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
              <Spinner /><span className="text-sm">Loading tasks…</span>
            </div>
          ) : visibleTasks.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-gray-400 text-sm">
                {tasks.length === 0 ? 'No tasks yet. Add one above!' : 'No tasks match your filter.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {visibleTasks.map((task) => {
                const isEditing = editingId === task.id;
                const isSaving = savingId === task.id;
                const isToggling = togglingId === task.id;
                const isDeleting = deletingId === task.id;
                const done = task.status === 'completed';

                return (
                  <li
                    key={task.id}
                    className={`flex items-center gap-3 px-4 py-3.5 transition-colors group ${
                      done ? 'bg-gray-50/60' : 'hover:bg-gray-50/80'
                    }`}
                  >
                    {/* Toggle checkbox */}
                    <button
                      onClick={() => toggleTask(task.id)}
                      disabled={isToggling || isDeleting}
                      aria-label={done ? 'Mark pending' : 'Mark completed'}
                      className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        done
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-gray-300 hover:border-indigo-400'
                      } disabled:opacity-40`}
                    >
                      {isToggling
                        ? <Spinner className="w-3 h-3" />
                        : done && <CheckIcon />}
                    </button>

                    {/* Title — normal or edit mode */}
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <input
                          ref={editInputRef}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(task.id);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          onBlur={() => saveEdit(task.id)}
                          className="w-full text-sm text-gray-800 border-b-2 border-indigo-400 bg-transparent outline-none pb-0.5"
                        />
                      ) : (
                        <span
                          onClick={() => !isSaving && !isDeleting && startEdit(task)}
                          title="Click to edit"
                          className={`block text-sm cursor-text break-words transition-all ${
                            done ? 'line-through text-gray-400' : 'text-gray-800 hover:text-indigo-700'
                          } ${isSaving ? 'opacity-50' : ''}`}
                        >
                          {isSaving ? <Spinner className="w-3.5 h-3.5 inline mr-1" /> : null}
                          {task.title}
                        </span>
                      )}
                    </div>

                    {/* Timestamp */}
                    <span className="text-xs text-gray-400 shrink-0 hidden sm:block">
                      {new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    {/* Delete */}
                    <button
                      onClick={() => deleteTask(task.id)}
                      disabled={isDeleting || isEditing}
                      aria-label={`Delete task: ${task.title}`}
                      className="shrink-0 rounded-lg p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all opacity-0 group-hover:opacity-100"
                    >
                      {isDeleting ? <Spinner className="w-4 h-4" /> : <TrashIcon />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Footer hint when in edit mode */}
          {editingId && (
            <div className="px-6 py-2 bg-indigo-50 border-t border-indigo-100 text-xs text-indigo-600">
              Press <kbd className="font-mono bg-white border border-indigo-200 px-1 rounded">Enter</kbd> to save ·{' '}
              <kbd className="font-mono bg-white border border-indigo-200 px-1 rounded">Esc</kbd> to cancel
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

/* ─── Icons & helpers ─── */

function Spinner({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className} text-current`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2,6 5,9 10,3" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}
