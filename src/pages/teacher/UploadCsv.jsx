import { useState } from 'react'
import Navbar from '../../components/Navbar'
import Card from '../../components/Card'
import { supabase } from '../../lib/supabase'

function normalizeDifficulty(d) {
  const v = String(d || '').toLowerCase().trim()
  return v === 'easy' || v === 'medium' || v === 'hard' ? v : null
}

export default function UploadCsvPage() {
  const [file, setFile] = useState(null)
  const [creatingQuiz, setCreatingQuiz] = useState(false)
  const [quizTitle, setQuizTitle] = useState('')
  const [quizSubject, setQuizSubject] = useState('')
  const [busy, setBusy] = useState(false)
  const [resultMsg, setResultMsg] = useState(null)
  const [errors, setErrors] = useState([])
  const [quizCode, setQuizCode] = useState(null)

  async function handleUpload() {
    if (!file) return
    setBusy(true); setErrors([]); setResultMsg(null); setQuizCode(null)
    try {
      const Papa = (await import('papaparse')).default
      await new Promise((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: async (res) => {
            try {
              const rows = res.data || []
              const errs = []
              const required = ['title','question_text','answer','difficulty']
              const missing = required.filter(h => !(res.meta.fields || []).includes(h))
              if (missing.length) {
                setErrors([`CSV headers missing: ${missing.join(', ')}`])
                setBusy(false)
                resolve()
                return
              }
              const payload = rows.map((r, idx) => {
                const d = normalizeDifficulty(r.difficulty)
                if (!r.title || !r.question_text || !r.answer || !d) {
                  errs.push(`Row ${idx+2}: invalid. Required fields & difficulty must be easy|medium|hard`)
                  return null
                }
                return {
                  title: String(r.title).trim(),
                  question_text: String(r.question_text).trim(),
                  answer: String(r.answer).trim(),
                  difficulty: d,
                  correct_answer: String(r.answer).trim(),
                  options: null,
                  is_published: true,
                }
              }).filter(Boolean)

              if (errs.length) setErrors(errs)
              if (payload.length === 0) { setBusy(false); resolve(); return }

              const { data: inserted, error } = await supabase
                .from('exercises')
                .insert(payload)
                .select('id')

              if (error) {
                setErrors([`Insert failed: ${error.message}`])
                setBusy(false)
                resolve()
                return
              }

              setResultMsg(`Inserted ${inserted?.length || 0} exercises${errs.length ? `, ${errs.length} errors` : ''}.`)

              if (creatingQuiz && inserted && inserted.length) {
                const first10 = inserted.slice(0, 10).map(r => r.id)
                const { data: q, error: qerr } = await supabase.rpc('create_quiz', {
                  p_title: quizTitle || 'Untitled Quiz',
                  p_subject: quizSubject || null,
                  p_exercise_ids: first10,
                })
                if (qerr) setErrors(prev => [...prev, `Create quiz failed: ${qerr.message}`])
                else setQuizCode(q.code)
              }
              setBusy(false)
              resolve()
            } catch (e) {
              setErrors([e?.message || 'Unknown error'])
              setBusy(false)
              resolve()
            }
          },
          error: (e) => { setErrors([e.message]); setBusy(false); resolve() },
        })
      })
    } catch (e) {
      setErrors([e?.message || 'Unknown error'])
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4">Upload CSV</h1>
        <Card>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Headers must be exactly: title, question_text, answer, difficulty. Difficulty must be easy|medium|hard.</p>
            <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <div className="flex items-center gap-3">
              <input id="mkq" type="checkbox" checked={creatingQuiz} onChange={e=>setCreatingQuiz(e.target.checked)} />
              <label htmlFor="mkq" className="text-sm">Create Quiz from this CSV (first 10)</label>
            </div>
            {creatingQuiz && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input className="rounded-xl border border-slate-200 px-3 py-2" placeholder="Quiz title" value={quizTitle} onChange={e=>setQuizTitle(e.target.value)} />
                <input className="rounded-xl border border-slate-200 px-3 py-2" placeholder="Subject (optional)" value={quizSubject} onChange={e=>setQuizSubject(e.target.value)} />
              </div>
            )}
            <div>
              <button disabled={!file || busy} onClick={handleUpload} className="rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50">{busy ? 'Uploading…' : 'Upload CSV'}</button>
            </div>
            {resultMsg && <div className="text-green-600 text-sm">{resultMsg}</div>}
            {quizCode && (
              <div className="p-3 rounded bg-violet-50 border border-violet-200">
                <div className="text-sm text-gray-600">Share this quiz code:</div>
                <div className="text-2xl font-bold tracking-widest">{quizCode}</div>
              </div>
            )}
            {errors.length > 0 && (
              <div>
                <div className="font-medium text-red-600">Errors:</div>
                <ul className="list-disc ml-5 text-sm text-red-600">
                  {errors.map((e,i)=>(<li key={i}>{e}</li>))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  )
}

