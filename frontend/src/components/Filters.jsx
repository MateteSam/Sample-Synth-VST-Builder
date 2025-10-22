import React from 'react';

export default function Filters({ filter, setFilter, search, setSearch }) {
  return (
  <div className="card compact" style={{ marginTop: 12 }}>
      <div className="row wrap">
        <div className="row gap">
          <button onClick={() => setFilter('all')} disabled={filter === 'all'}>All</button>
          <button onClick={() => setFilter('active')} disabled={filter === 'active'}>Active</button>
          <button onClick={() => setFilter('completed')} disabled={filter === 'completed'}>Completed</button>
        </div>
        <input
          type="search"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
      </div>
    </div>
  );
}