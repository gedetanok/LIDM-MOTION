import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Card from '../../components/Card'
import { supabase } from '../../lib/supabase'

export default function TeacherExerciseForm({ mode }) {
  const navigate = useNavigate()
  const params = useParams()
  const isEdit = mode === 'edit'
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    subject: '',
    difficulty: 'easy',
    question_text: '',
    options: ['', '', '', ''],
    correct_answer: '',
    is_published: true,
  })
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    async function load() {
      if (!isEdit) return
      setLoading(true)
      const { data, error } = await supabase
        .from('exercises')
        .select('id,title,subject,difficulty,question_text,options,correct_answer,is_published')
        .eq('id', params.id)
        .single()
      if (!active) return
      if (error) setError(error.message)
      if (data) {
        setForm({
          title: data.title || '',
          subject: data.subject || '',
          difficulty: data.difficulty || 'easy',
          question_text: data.question_text || '',
          options: Array.isArray(data.options) && data.options.length === 4 ? data.options : ['', '', '', ''],
          correct_answer: data.correct_answer || '',
          is_published: data.is_published ?? true,
        })
      }
      setLoading(false)
    }
    load()
    return () => { active = false }
  }, [isEdit, params.id])

  function updateOption(idx, value) {
    setForm((f) => {
      const next = [...f.options]
      next[idx] = value
      return { ...f, options: next }
    })
  }

  function validate() {
    const { title, difficulty, question_text, options, correct_answer } = form
    if (!title.trim() || !question_text.trim()) return 'Title and question are required'
    if (!['easy','medium','hard'].includes(difficulty)) return 'Invalid difficulty'
    const filled = options.filter(o => String(o || '').trim() !== '')
    if (filled.length !== 4) return 'Provide exactly 4 options'
    if (!filled.includes(correct_answer)) return 'Correct answer must be one of the options'
    return null
  }

  async function onSubmit(e) {
    e.preventDefault()
    const msg = validate()
    if (msg) { setError(msg); return }
    setError(null)
    setLoading(true)
    const payload = {
      title: form.title.trim(),
      subject: form.subject.trim() || null,
      difficulty: form.difficulty,
      question_text: form.question_text,
      options: form.options.map(String),
      correct_answer: String(form.correct_answer),
      answer: String(form.correct_answer),
      is_published: !!form.is_published,
    }
    let resp
    if (isEdit) {
      resp = await supabase.from('exercises').update(payload).eq('id', params.id)
    } else {
      resp = await supabase.from('exercises').insert(payload)
    }
    setLoading(false)
    if (resp.error) { setError(resp.error.message); return }
    navigate('/teacher/exercises')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-gray-800">{isEdit ? 'Edit Exercise' : 'Create Exercise'}</h1>
        </div>
        <Card>
          <form onSubmit={onSubmit} className="space-y-4">
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <div>
              <label className="block text-sm text-slate-600 mb-1">Title</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Subject</label>
                <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Difficulty</label>
                <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2">
                  <option value="easy">easy</option>
                  <option value="medium">medium</option>
                  <option value="hard">hard</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Question</label>
              <textarea value={form.question_text} onChange={e => setForm({ ...form, question_text: e.target.value })} rows={5} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
            </div>
            <div>
              <div className="text-sm text-slate-600 mb-1">MCQ Options</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {form.options.map((opt, idx) => (
                  <input key={idx} value={opt} onChange={e => updateOption(idx, e.target.value)} placeholder={`Option ${idx + 1}`} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
                ))}
              </div>
              <div className="mt-3">
                <label className="block text-sm text-slate-600 mb-1">Correct Answer</label>
                <select value={form.correct_answer} onChange={e => setForm({ ...form, correct_answer: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2">
                  <option value="">-- choose --</option>
                  {form.options.map((o, i) => (
                    <option key={i} value={o}>{o}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input id="publish" type="checkbox" checked={form.is_published} onChange={e => setForm({ ...form, is_published: e.target.checked })} />
              <label htmlFor="publish" className="text-sm text-slate-700">Published</label>
            </div>
            <div className="flex justify-end">
              <button disabled={loading} className="rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50">{isEdit ? 'Save Changes' : 'Create'}</button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  )
}

