import React from 'react';

export default function TaskForm({ newTitle, setNewTitle, addTask }) {
  return (
  <form onSubmit={addTask} className="card compact mt-12">
      <div className="row">
        <input
          type="text"
          placeholder="New task title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <button type="submit" className="primary">Add</button>
      </div>
    </form>
  );
}