import { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar'
import Card from '../../components/Card'
import { supabase } from '../../lib/supabase'

export default function TeacherQuizCreate() {
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [rows, setRows] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [creating, setCreating] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      const { data, error } = await supabase
        .from('exercises')
        .select('id,title,subject,difficulty,created_at')
        .order('created_at', { ascending: false })
        .limit(50)
      if (!active) return
      if (error) setError(error.message)
      setRows(data || [])
    }
    load()
    return () => { active = false }
  }, [])

  function toggle(id) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (next.size < 10) next.add(id)
      return next
    })
  }

  async function createQuiz() {
    setError('')
    if (!title.trim()) { setError('Title is required'); return }
    if (selected.size === 0) { setError('Pick at least 1 question (max 10)'); return }
    setCreating(true)
    try {
      const ids = Array.from(selected)
      const { data, error } = await supabase.rpc('create_quiz', {
        p_title: title.trim(),
        p_subject: subject || null,
        p_exercise_ids: ids,
      })
      if (error) throw error
      setCode(data.code)
    } catch (e) {
      setError(e.message || 'Failed to create quiz')
      console.error('create_quiz failed', e)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4">Create Quiz</h1>
        <Card>
          <div className="grid gap-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Title</label>
              <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Subject (optional)</label>
              <input value={subject} onChange={e=>setSubject(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
            </div>
            {error && <div className="text-sm text-red-600">{error}</div>}
            <div>
              <div className="text-sm text-slate-600 mb-2">Pick up to 10 Questions</div>
              <div className="max-h-80 overflow-auto border border-slate-200 rounded-xl">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-50 text-left text-slate-500">
                    <tr>
                      <th className="py-2 px-3">Pick</th>
                      <th className="py-2 px-3">Title</th>
                      <th className="py-2 px-3">Difficulty</th>
                      <th className="py-2 px-3">Subject</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(r => (
                      <tr key={r.id} className="border-t border-slate-100">
                        <td className="py-2 px-3">
                          <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} />
                        </td>
                        <td className="py-2 px-3 text-slate-800">{r.title}</td>
                        <td className="py-2 px-3 capitalize">{r.difficulty}</td>
                        <td className="py-2 px-3">{r.subject || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-xs text-slate-500 mt-1">Selected {selected.size}/10</div>
            </div>
            <div className="flex items-center gap-3">
              <button disabled={creating} onClick={createQuiz} className="rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50">{creating ? 'Creating…' : 'Create Quiz'}</button>
              {code && <span className="text-sm">Share code: <span className="font-semibold">{code}</span></span>}
            </div>
          </div>
        </Card>
      </main>
    </div>
  )
}

