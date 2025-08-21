import { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar'
import Card from '../../components/Card'
import { supabase } from '../../lib/supabase'

export default function TeacherMyQuizzes() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    const { data, error } = await supabase
      .from('quizzes')
      .select('id, code, title, subject, is_active, created_at')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    setRows(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function toggleActive(id, current) {
    const { error } = await supabase.from('quizzes').update({ is_active: !current }).eq('id', id)
    if (error) { console.error('toggle active failed', error); return }
    setRows(r => r.map(q => q.id === id ? { ...q, is_active: !current } : q))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-gray-800">My Quizzes</h1>
        </div>
        <Card>
          {loading ? (
            <div className="text-gray-500">Loading…</div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : rows.length === 0 ? (
            <div className="text-gray-500">No quizzes yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-slate-500">
                  <tr>
                    <th className="py-2 pr-4">Title</th>
                    <th className="py-2 pr-4">Code</th>
                    <th className="py-2 pr-4">Subject</th>
                    <th className="py-2 pr-4">Active</th>
                    <th className="py-2 pr-4">Created</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr key={row.id} className="border-t border-slate-100">
                      <td className="py-2 pr-4 text-slate-800">{row.title}</td>
                      <td className="py-2 pr-4 font-mono">{row.code}</td>
                      <td className="py-2 pr-4">{row.subject || '-'}</td>
                      <td className="py-2 pr-4">{row.is_active ? 'Yes' : 'No'}</td>
                      <td className="py-2 pr-4">{new Date(row.created_at).toLocaleString()}</td>
                      <td className="py-2 pr-4">
                        <button onClick={() => toggleActive(row.id, row.is_active)} className="text-indigo-600 hover:underline">
                          {row.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>
    </div>
  )
}

