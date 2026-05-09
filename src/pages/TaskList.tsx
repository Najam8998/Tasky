// TaskList.tsx — Browse all tasks with filtering
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { type Task, type TaskStatus } from '../lib/contract'
import { useTaskStore } from '../context/TaskStoreContext'
import { TaskCard } from '../components/TaskCard'

const FILTERS: { label: string; value: TaskStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
]

export const TaskList: React.FC = () => {
  const navigate = useNavigate()
  const { tasks }   = useTaskStore()
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all')
  const [search, setSearch] = useState('')

  const filtered = tasks.filter(t => {
    const matchStatus = filter === 'all' || t.status === filter
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  return (
    <div className="page">
      <div className="container">
        <div style={s.header}>
          <div>
            <h1 style={{ fontSize:'2rem', fontWeight:800, color:'#f0f0ff', marginBottom:8 }}>Browse Tasks</h1>
            <p style={{ color:'#8888aa' }}>{filtered.length} task{filtered.length !== 1 ? 's' : ''} found</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/create')}>+ Create Task</button>
        </div>

        {/* Controls */}
        <div style={s.controls}>
          <div style={s.filterRow}>
            {FILTERS.map(f => (
              <button
                key={f.value}
                className={`btn ${filter === f.value ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding:'8px 18px', fontSize:'0.85rem' }}
                onClick={() => setFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <input
            className="form-input"
            style={{ maxWidth:280 }}
            placeholder="🔍 Search tasks…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div style={s.empty}>
            <div style={{ fontSize:'3rem', marginBottom:16 }}>📭</div>
            <h3 style={{ color:'#f0f0ff', marginBottom:8 }}>No tasks found</h3>
            <p style={{ color:'#8888aa', marginBottom:24 }}>
              {tasks.length === 0 ? 'Be the first to post a task!' : 'Try a different filter or search.'}
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/create')}>Create First Task</button>
          </div>
        ) : (
          <div style={s.grid}>
            {filtered.map(t => <TaskCard key={t.id} task={t} />)}
          </div>
        )}
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  header:    { display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:32, flexWrap:'wrap', gap:16 },
  controls:  { display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, marginBottom:32, flexWrap:'wrap' },
  filterRow: { display:'flex', gap:8, flexWrap:'wrap' },
  grid:      { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:20 },
  empty:     { textAlign:'center', padding:'80px 0', display:'flex', flexDirection:'column', alignItems:'center' },
}
