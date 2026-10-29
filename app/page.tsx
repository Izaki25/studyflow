
"use client";

import { useEffect, useMemo, useState } from "react";

type Task = {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  priority: "Low" | "Medium" | "High";
  completed: boolean;
  createdAt: number;
};

type Filter = "All" | "Pending" | "Completed";

const STORAGE_KEY = "studyflow-tasks-v2";

const starterTasks: Task[] = [
  {
    id: "sample-1",
    title: "Review database triggers",
    subject: "Database Systems",
    dueDate: "",
    priority: "High",
    completed: false,
    createdAt: 1,
  },
  {
    id: "sample-2",
    title: "Practice networking concepts",
    subject: "Networking",
    dueDate: "",
    priority: "Medium",
    completed: true,
    createdAt: 2,
  },
  {
    id: "sample-3",
    title: "Prepare for upcoming quiz",
    subject: "General Education",
    dueDate: "",
    priority: "High",
    completed: false,
    createdAt: 3,
  },
];

const emptyForm = {
  title: "",
  subject: "",
  dueDate: "",
  priority: "Medium" as Task["priority"],
};

function Icon({
  name,
}: {
  name: "grid" | "check" | "calendar" | "chart" | "search" | "plus" | "clock" | "trash" | "edit" | "close" | "book";
}) {
  const paths: Record<string, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    check: <><path d="m5 12 4 4L19 6" /><path d="M21 12a9 9 0 1 1-5.3-8.2" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></>,
    chart: <><path d="M3 3v18h18" /><path d="m7 14 4-4 4 3 6-7" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    trash: <><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6" /><path d="M10 11v5m4-5v5" /></>,
    edit: <><path d="m15 5 4 4M4 20l4-.8L19 8a2.1 2.1 0 0 0-3-3L5 16z" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21z" /><path d="M4 5v16M8 7h8M8 11h8" /></>,
  };

  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>(starterTasks);
  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState<Filter>("All");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved !== null) {
        const parsed: unknown = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setTasks(parsed as Task[]);
        } else {
          setTasks(starterTasks);
        }
      } else {
        setTasks(starterTasks);
      }
    } catch {
      setTasks(starterTasks);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      setNotice("Unable to save browser data. Check your storage settings.");
    }
  }, [tasks, ready]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 3000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const completed = tasks.filter((task) => task.completed).length;
  const pending = tasks.length - completed;
  const progress = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0;

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks
      .filter((task) => {
        if (filter === "Pending" && task.completed) return false;
        if (filter === "Completed" && !task.completed) return false;

        return (
          task.title.toLowerCase().includes(query) ||
          task.subject.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed);
        const priorityOrder = { High: 0, Medium: 1, Low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
  }, [tasks, filter, search]);

  function openAddForm() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEditForm(task: Task) {
    setEditingId(task.id);
    setForm({
      title: task.title,
      subject: task.subject,
      dueDate: task.dueDate,
      priority: task.priority,
    });
    setShowForm(true);
  }

  function saveTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = form.title.trim();
    if (!title) {
      setNotice("Please enter a task title.");
      return;
    }

    if (editingId) {
      setTasks((current) =>
        current.map((task) =>
          task.id === editingId
            ? {
                ...task,
                title,
                subject: form.subject.trim() || "Personal",
                dueDate: form.dueDate,
                priority: form.priority,
              }
            : task
        )
      );
      setNotice("Task updated successfully.");
    } else {
      const newTask: Task = {
        id: crypto.randomUUID(),
        title,
        subject: form.subject.trim() || "Personal",
        dueDate: form.dueDate,
        priority: form.priority,
        completed: false,
        createdAt: Date.now(),
      };

      setTasks((current) => [newTask, ...current]);
      setNotice("New task added.");
    }

    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  }

  function toggleTask(id: string) {
    setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  }

  function deleteTask(id: string) {
    if (!window.confirm("Delete this task? This action cannot be undone.")) return;
    setTasks((current) => current.filter((task) => task.id !== id));
    setNotice("Task deleted.");
  }

  function resetTasks() {
    if (!window.confirm("Restore the sample tasks? Your current tasks will be replaced.")) return;
    setTasks(starterTasks);
    setFilter("All");
    setSearch("");
    setNotice("Sample tasks restored.");
  }

  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <main className="sf-app">
      <aside className="sf-sidebar">
        <a className="sf-brand" href="#" aria-label="StudyFlow home">
          <span className="sf-brand-mark"><Icon name="book" /></span>
          <span>studyflow<span className="sf-brand-dot">.</span></span>
        </a>

        <div className="sf-workspace-label">WORKSPACE</div>

        <nav className="sf-nav" aria-label="Main navigation">
          <a className="sf-nav-item active" href="#overview">
            <Icon name="grid" /> <span>Overview</span>
          </a>
          <a className="sf-nav-item" href="#tasks">
            <Icon name="check" /> <span>My Tasks</span>
            <span className="sf-nav-count">{pending}</span>
          </a>
          <a className="sf-nav-item" href="#planner">
            <Icon name="calendar" /> <span>Study Planner</span>
            <span className="sf-soon">Soon</span>
          </a>
          <a className="sf-nav-item" href="#analytics">
            <Icon name="chart" /> <span>Analytics</span>
          </a>
        </nav>

        <div className="sf-sidebar-spacer" />

        <div className="sf-focus-card">
          <div className="sf-focus-icon"><Icon name="clock" /></div>
          <h3>Small steps. Big results.</h3>
          <p>Consistency beats intensity. Keep showing up for yourself.</p>
          <div className="sf-focus-decoration">✳</div>
        </div>

        <div className="sf-sidebar-footer">
          <div className="sf-avatar">S</div>
          <div className="sf-profile-text">
            <strong>My Workspace</strong>
            <span>Personal planner</span>
          </div>
          <span className="sf-online-dot" />
        </div>
      </aside>

      <section className="sf-main" id="overview">
        <header className="sf-topbar">
          <div className="sf-breadcrumb">Workspace <span>/</span> Overview</div>
          <div className="sf-topbar-right">
            <span className="sf-status-dot" />
            <span className="sf-saved-label">{ready ? "Saved in this browser" : "Loading your tasks..."}</span>
            <div className="sf-avatar sf-avatar-small">S</div>
          </div>
        </header>

        <div className="sf-content">
          <section className="sf-welcome">
            <div>
              <div className="sf-date"><Icon name="calendar" /> {today}</div>
              <h1>Your progress starts <span>here.</span></h1>
              <p>One focused step at a time. You&apos;ve got this.</p>
            </div>
            <button className="sf-primary-button" onClick={openAddForm}>
              <Icon name="plus" /> Add new task
            </button>
          </section>

          <section className="sf-stats" aria-label="Task statistics">
            <article className="sf-stat-card">
              <div className="sf-stat-top">
                <span className="sf-stat-label">Total tasks</span>
                <span className="sf-stat-icon purple"><Icon name="grid" /></span>
              </div>
              <div className="sf-stat-number">{tasks.length}</div>
              <div className="sf-stat-foot">Tasks in your workspace</div>
            </article>
            <article className="sf-stat-card">
              <div className="sf-stat-top">
                <span className="sf-stat-label">Completed</span>
                <span className="sf-stat-icon green"><Icon name="check" /></span>
              </div>
              <div className="sf-stat-number">{completed}</div>
              <div className="sf-stat-foot"><span className="sf-green-text">Nice work!</span> Keep it up</div>
            </article>
            <article className="sf-stat-card">
              <div className="sf-stat-top">
                <span className="sf-stat-label">In progress</span>
                <span className="sf-stat-icon orange"><Icon name="clock" /></span>
              </div>
              <div className="sf-stat-number">{pending}</div>
              <div className="sf-stat-foot">Ready for your focus</div>
            </article>
            <article className="sf-stat-card sf-progress-card">
              <div className="sf-stat-top">
                <span className="sf-stat-label">Completion rate</span>
                <span className="sf-stat-icon blue"><Icon name="chart" /></span>
              </div>
              <div className="sf-progress-number">{progress}<span>%</span></div>
              <div className="sf-progress-track">
                <div className="sf-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <div className="sf-stat-foot">Your goals, your pace</div>
            </article>
          </section>

          <section className="sf-task-panel" id="tasks">
            <div className="sf-panel-heading">
              <div>
                <div className="sf-panel-title-row">
                  <h2>My tasks</h2>
                  <span className="sf-task-total">{tasks.length}</span>
                </div>
                <p>Stay organized and make today count.</p>
              </div>
              <button className="sf-secondary-button" onClick={resetTasks}>Reset demo data</button>
            </div>

            <div className="sf-task-controls">
              <div className="sf-search">
                <Icon name="search" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search tasks or subjects..."
                  aria-label="Search tasks"
                />
                {search && (
                  <button className="sf-clear-search" onClick={() => setSearch("")} aria-label="Clear search">
                    <Icon name="close" />
                  </button>
                )}
              </div>
              <div className="sf-filters" role="group" aria-label="Filter tasks">
                {(["All", "Pending", "Completed"] as Filter[]).map((item) => (
                  <button
                    key={item}
                    onClick={() => setFilter(item)}
                    className={`sf-filter ${filter === item ? "selected" : ""}`}
                    aria-pressed={filter === item}
                  >
                    {item}
                    {item === "All" && <span>{tasks.length}</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="sf-task-list">
              {filteredTasks.map((task) => (
                <article className={`sf-task-row ${task.completed ? "is-completed" : ""}`} key={task.id}>
                  <button
                    className={`sf-task-check ${task.completed ? "checked" : ""}`}
                    onClick={() => toggleTask(task.id)}
                    aria-label={task.completed ? `Mark ${task.title} as pending` : `Complete ${task.title}`}
                    aria-pressed={task.completed}
                  >
                    {task.completed && <Icon name="check" />}
                  </button>

                  <div className="sf-task-details">
                    <div className="sf-task-title">{task.title}</div>
                    <div className="sf-task-meta">
                      <span className="sf-subject"><Icon name="book" /> {task.subject}</span>
                      {task.dueDate && (
                        <span className="sf-due-date"><Icon name="calendar" /> {task.dueDate}</span>
                      )}
                    </div>
                  </div>

                  <span className={`sf-priority priority-${task.priority.toLowerCase()}`}>
                    <span />{task.priority}
                  </span>

                  <span className={`sf-task-status ${task.completed ? "status-done" : "status-pending"}`}>
                    {task.completed ? "Completed" : "Pending"}
                  </span>

                  <div className="sf-task-actions">
                    <button onClick={() => openEditForm(task)} aria-label={`Edit ${task.title}`} title="Edit task">
                      <Icon name="edit" />
                    </button>
                    <button onClick={() => deleteTask(task.id)} aria-label={`Delete ${task.title}`} title="Delete task">
                      <Icon name="trash" />
                    </button>
                  </div>
                </article>
              ))}

              {filteredTasks.length === 0 && (
                <div className="sf-empty">
                  <div className="sf-empty-icon"><Icon name="check" /></div>
                  <h3>{search ? "No matching tasks" : "Nothing here just yet"}</h3>
                  <p>{search ? "Try a different search term." : "Add a task to start organizing your day."}</p>
                  {!search && (
                    <button className="sf-primary-button" onClick={openAddForm}>
                      <Icon name="plus" /> Create your first task
                    </button>
                  )}
                </div>
              )}
            </div>

            <footer className="sf-panel-footer">
              <span>Showing {filteredTasks.length} of {tasks.length} tasks</span>
              <span><span className="sf-status-dot" /> Your data stays in this browser</span>
            </footer>
          </section>

          <section className="sf-bottom-grid">
            <article className="sf-encouragement" id="planner">
              <div className="sf-encouragement-symbol">✳</div>
              <div>
                <span className="sf-eyebrow">A LITTLE REMINDER</span>
                <h3>Progress over perfection.</h3>
                <p>You don&apos;t need to do everything today. Just take the next step.</p>
              </div>
            </article>
            <article className="sf-summary-card" id="analytics">
              <div className="sf-summary-heading">
                <span className="sf-stat-icon purple"><Icon name="chart" /></span>
                <div><h3>Your task summary</h3><p>Overall completion</p></div>
              </div>
              <div className="sf-summary-bar">
                <div style={{ width: `${progress}%` }} />
              </div>
              <div className="sf-summary-bottom"><strong>{progress}% completed</strong><span>{pending} left to do</span></div>
            </article>
          </section>

          <footer className="sf-page-footer">Made for better study habits <span>✳</span> StudyFlow © 2026</footer>
        </div>
      </section>

      {showForm && (
        <div className="sf-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setShowForm(false);
        }}>
          <section className="sf-modal" role="dialog" aria-modal="true" aria-labelledby="sf-modal-title">
            <div className="sf-modal-heading">
              <div>
                <span className="sf-eyebrow">{editingId ? "KEEP IT ORGANIZED" : "MAKE IT HAPPEN"}</span>
                <h2 id="sf-modal-title">{editingId ? "Edit task" : "Create a task"}</h2>
                <p>{editingId ? "Update the details of your task." : "Add a goal and give it a place in your day."}</p>
              </div>
              <button className="sf-modal-close" onClick={() => setShowForm(false)} aria-label="Close form">
                <Icon name="close" />
              </button>
            </div>

            <form className="sf-task-form" onSubmit={saveTask}>
              <label>
                Task title <span>*</span>
                <input
                  autoFocus
                  maxLength={120}
                  required
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  placeholder="e.g. Review chapter 3"
                />
              </label>
              <label>
                Subject or category
                <input
                  maxLength={60}
                  value={form.subject}
                  onChange={(event) => setForm({ ...form, subject: event.target.value })}
                  placeholder="e.g. Database Systems"
                />
              </label>
              <div className="sf-form-two-col">
                <label>
                  Due date
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
                  />
                </label>
                <label>
                  Priority
                  <select
                    value={form.priority}
                    onChange={(event) => setForm({ ...form, priority: event.target.value as Task["priority"] })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </label>
              </div>
              <div className="sf-form-actions">
                <button type="button" className="sf-secondary-button" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="sf-primary-button">
                  <Icon name="check" /> {editingId ? "Save changes" : "Create task"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {notice && <div className="sf-toast" role="status">{notice}</div>}
    </main>
  );
}
