import React from 'react';

export default function TaskItem({ t, editingId, editTitle, setEditTitle, startEdit, saveEdit, cancelEdit, toggleTask, deleteTask }) {
  return (
    <li className="item">
      <label className="label">
        <input
          type="checkbox"
          checked={t.completed}
          onChange={() => toggleTask(t)}
        />
        {editingId === t.id ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="task-edit-input"
          />
        ) : (
          <span className={t.completed ? 'completed' : ''}>{t.title}</span>
        )}
      </label>
      {editingId === t.id ? (
        <div className="row gap">
          <button className="secondary" onClick={() => saveEdit(t)}>Save</button>
          <button onClick={cancelEdit}>Cancel</button>
        </div>
      ) : (
        <div className="row gap">
          <button className="secondary" onClick={() => startEdit(t)}>Edit</button>
          <button className="danger" onClick={() => deleteTask(t.id)}>Delete</button>
        </div>
      )}
    </li>
  );
}