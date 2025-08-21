import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Card from '../../components/Card'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function TeacherExercisesList() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showImport, setShowImport] = useState(false)
  const [csvPreview, setCsvPreview] = useState([])
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    let active = true
    async function load() {
      if (!user) return
      setLoading(true)
      const { data, error } = await supabase
        .from('exercises')
        .select('id,title,subject,difficulty,is_published,created_at')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })
      if (!active) return
      if (error) setError(error.message)
      setRows(data || [])
      setLoading(false)
    }
    load()
    setShowImport(searchParams.get('import') === '1')
    return () => { active = false }
  }, [user])

  async function togglePublish(id, current) {
    await supabase.from('exercises').update({ is_published: !current }).eq('id', id)
    setRows((r) => r.map(x => x.id === id ? { ...x, is_published: !current } : x))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-gray-800">My Exercises</h1>
          <div className="flex gap-3">
            <Link to="/teacher/exercises/new" className="rounded-xl bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700">New Exercise</Link>
            <Link to="#" onClick={(e) => { e.preventDefault(); setShowImport(true); setSearchParams({ import: '1' }) }} className="rounded-xl border border-slate-200 bg-white px-4 py-2 hover:bg-slate-50">Upload CSV</Link>
          </div>
        </div>

        <Card>
          {loading ? (
            <div className="text-gray-500">Loading...</div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : rows.length === 0 ? (
            <div className="text-gray-500">No exercises yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-slate-500">
                  <tr>
                    <th className="py-2 pr-4">Title</th>
                    <th className="py-2 pr-4">Subject</th>
                    <th className="py-2 pr-4">Difficulty</th>
                    <th className="py-2 pr-4">Published</th>
                    <th className="py-2 pr-4">Created</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr key={row.id} className="border-t border-slate-100">
                      <td className="py-2 pr-4 text-slate-800">{row.title}</td>
                      <td className="py-2 pr-4">{row.subject || '-'}</td>
                      <td className="py-2 pr-4 capitalize">{row.difficulty}</td>
                      <td className="py-2 pr-4">
                        <button onClick={() => togglePublish(row.id, row.is_published)} className={"px-2 py-1 rounded text-xs " + (row.is_published ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700')}>
                          {row.is_published ? 'Published' : 'Draft'}
                        </button>
                      </td>
                      <td className="py-2 pr-4">{new Date(row.created_at).toLocaleString()}</td>
                      <td className="py-2 pr-4">
                        <Link to={`/teacher/exercises/${row.id}/edit`} className="text-indigo-600 hover:underline mr-3">Edit</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {showImport && (
          <div className="mt-6">
            <Card>
              <div className="flex items-center justify-between mb-3">
                <div className="text-lg font-medium text-slate-800">Import CSV</div>
                <button onClick={() => { setShowImport(false); setSearchParams({}) }} className="text-slate-600 hover:underline">Close</button>
              </div>
              <CsvImport onPreview={(rows) => setCsvPreview(rows)} onResetPreview={() => setCsvPreview([])} onImported={() => { setCsvPreview([]); setShowImport(false); setSearchParams({}); }} />
              {csvPreview.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm text-slate-500 mb-2">Preview (first {Math.min(10, csvPreview.length)} rows)</div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-slate-500">
                          {Object.keys(csvPreview[0]).map(h => (
                            <th key={h} className="py-2 pr-4">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvPreview.slice(0, 10).map((r, i) => (
                          <tr key={i} className="border-t border-slate-100">
                            {Object.keys(csvPreview[0]).map(h => (
                              <td key={h} className="py-2 pr-4">{String(r[h])}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}

function CsvImport({ onPreview, onResetPreview, onImported }) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  async function handleParse() {
    if (!file) return
    const Papa = (await import('papaparse')).default
    setLoading(true)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (res) => {
        const raw = res.data || []
        onPreview(raw)
        // prepare rows as per spec but don't insert yet; provide explicit Import button
        setLoading(false)
      }
    })
  }
  async function handleImport() {
    if (!file) return
    const Papa = (await import('papaparse')).default
    setLoading(true)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (res) => {
        const rows = (res.data || []).map((r) => {
          let options = null
          try { options = r.options ? JSON.parse(r.options) : null } catch { options = null }
          const correct = r.correct_answer ?? r.answer
          return {
            title: r.title?.trim(),
            subject: r.subject?.trim(),
            question_text: r.question_text,
            answer: String(correct),
            difficulty: (r.difficulty || 'easy').toLowerCase(),
            options,
            correct_answer: String(correct),
            is_published: String(r.is_published ?? 'true').toLowerCase() !== 'false',
          }
        })
        const valid = rows.filter(x =>
          x.title && x.question_text && x.correct_answer &&
          (!x.options || (Array.isArray(x.options) && x.options.length === 4 && x.options.includes(x.correct_answer)))
        )
        const { error } = await supabase.from('exercises').insert(valid)
        setLoading(false)
        if (error) alert(error.message)
        else { alert(`Imported ${valid.length} exercises`); onImported && onImported() }
      }
    })
  }
  return (
    <div>
      <div className="flex items-center gap-3">
        <input type="file" accept=".csv" onChange={(e) => { onResetPreview && onResetPreview(); setFile(e.target.files?.[0] || null) }} />
        <button onClick={handleParse} disabled={!file || loading} className="rounded-xl border border-slate-200 bg-white px-4 py-2 hover:bg-slate-50 disabled:opacity-50">Preview</button>
        <button onClick={handleImport} disabled={!file || loading} className="rounded-xl bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700 disabled:opacity-50">Import</button>
      </div>
    </div>
  )
}

