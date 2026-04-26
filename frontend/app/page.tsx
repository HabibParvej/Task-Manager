'use client';

import { useEffect, useState } from 'react';

interface Task {
  id: string;
  title: string;
  createdAt: string;
}

// Relative path — works on localhost AND on Vercel without any env var
const API = '/api/tasks';

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchTasks() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(API);
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const data: Task[] = await res.json();
      setTasks(data);
    } catch {
      setError('Could not load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  async function addTask() {
    const title = input.trim();
    if (!title) return;
    try {
      setAdding(true);
      setError(null);
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error('Failed to add task');
      const newTask: Task = await res.json();
      setTasks((prev) => [...prev, newTask]);
      setInput('');
    } catch {
      setError('Could not add task. Please try again.');
    } finally {
      setAdding(false);
    }
  }

  async function deleteTask(id: string) {
    try {
      setDeletingId(id);
      setError(null);
      const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('Failed to delete task');
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setError('Could not delete task. Please try again.');
    } finally {
      setDeletingId(null);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') addTask();
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            Task Manager
          </h1>
          <p className="mt-2 text-gray-500 text-sm">
            Stay organized. Stay productive.
          </p>
        </div>

        {/* Input area */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            New Task
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What needs to be done?"
              disabled={adding}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-50 transition"
            />
            <button
              onClick={addTask}
              disabled={adding || !input.trim()}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {adding ? (
                <span className="flex items-center gap-2">
                  <Spinner /> Adding…
                </span>
              ) : (
                'Add'
              )}
            </button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Task list */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Tasks</span>
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
              {tasks.length} {tasks.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
              <Spinner />
              <span className="text-sm">Loading tasks…</span>
            </div>
          ) : tasks.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-gray-400 text-sm">No tasks yet. Add one above!</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group"
                >
                  <span className="flex-1 text-sm text-gray-800 break-words">
                    {task.title}
                  </span>
                  <span className="text-xs text-gray-400 shrink-0 hidden sm:block">
                    {new Date(task.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <button
                    onClick={() => deleteTask(task.id)}
                    disabled={deletingId === task.id}
                    aria-label={`Delete task: ${task.title}`}
                    className="shrink-0 rounded-lg p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all opacity-0 group-hover:opacity-100"
                  >
                    {deletingId === task.id ? (
                      <Spinner className="w-4 h-4" />
                    ) : (
                      <TrashIcon />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}

function Spinner({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className} text-current`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  );
}
