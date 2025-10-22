import React from 'react';
import TaskItem from './TaskItem.jsx';

export default function TaskList({ tasks, editingId, editTitle, setEditTitle, startEdit, saveEdit, cancelEdit, toggleTask, deleteTask }) {
  if (tasks.length === 0) {
    return <p className="muted">No tasks yet.</p>;
  }
  return (
    <ul className="list">
      {tasks.map((t) => (
        <TaskItem
          key={t.id}
          t={t}
          editingId={editingId}
          editTitle={editTitle}
          setEditTitle={setEditTitle}
          startEdit={startEdit}
          saveEdit={saveEdit}
          cancelEdit={cancelEdit}
          toggleTask={toggleTask}
          deleteTask={deleteTask}
        />
      ))}
    </ul>
  );
}