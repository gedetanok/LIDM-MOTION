import { useEffect, useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import Card from '../components/Card'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { buildOptions } from '../utils/mcq'
import EmotionPicker from '../components/EmotionPicker'
import FlashcardGrid from '../components/exercises/FlashcardGrid'
import GeometryGraph from '../components/viz/GeometryGraph'
import { deriveVisualizationMeta } from '../utils/visual-meta'
import { applyGamification } from '../utils/gamification'
import { EmojiBurst } from '../components/emoji/EmojiBurst'
import ChatBot from '../components/chat/ChatBot'

export default function Exercises() {
  const { user } = useAuth()

  // Phase: 'idle' | 'emotionBefore' | 'quiz' | 'emotionAfter' | 'summary'
  const [phase, setPhase] = useState('idle')

  // Emotions
  const [beforeEmotion, setBeforeEmotion] = useState(null)
  const [afterEmotion, setAfterEmotion] = useState(null)
  const [burst, setBurst] = useState(null)

  // Questions state
  const [loading, setLoading] = useState(false)
  const [exercises, setExercises] = useState([])
  const [index, setIndex] = useState(0)

  // Per-question UI state
  const [selectedIdx, setSelectedIdx] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(null)

  // Answers summary
  const [answered, setAnswered] = useState([]) // { exercise_id, is_correct }

  // Fetch 10 questions when entering quiz and not loaded yet
  useEffect(() => {
    async function fetchExercises(limit = 10, difficulty) {
      setLoading(true)
      let q = supabase
        .from('exercises')
        .select('id,title,question_text,answer,correct_answer,options,difficulty,visual_meta')
        .limit(limit)
      if (difficulty) q = q.eq('difficulty', difficulty)
      const { data, error } = await q
      if (error) {
        setExercises([])
        setLoading(false)
        return
      }
      const shuffled = [...(data || [])].sort(() => Math.random() - 0.5)
      const picked = shuffled.slice(0, 10).map((e) => {
        const hasOptions = Array.isArray(e.options) && e.options.length === 4
        const correct = String(e.correct_answer ?? e.answer)
        const opts = hasOptions ? [...e.options] : buildOptions(correct)
        // shuffle copy of options but keep correct value for result index later
        const shuffledOpts = [...opts].sort(() => Math.random() - 0.5)
        return {
          ...e,
          answer: correct,
          options: shuffledOpts,
          visual_meta: e.visual_meta || deriveVisualizationMeta(e) || null,
        }
      })
      setExercises(picked)
      setIndex(0)
      setSelectedIdx(null)
      setSubmitted(false)
      setIsCorrect(null)
      setAnswered([])
      setLoading(false)
    }
    if (phase === 'quiz' && exercises.length === 0) {
      fetchExercises(10)
    }
  }, [phase])

  const current = useMemo(() => exercises[index] ?? null, [exercises, index])

  // Emotion selection with burst
  function handleBeforeSelect(key, emoji) {
    setBeforeEmotion(key)
    setBurst(emoji)
    setTimeout(() => {
      setBurst(null)
      setPhase('quiz')
    }, 950)
  }

  function handleAfterSelect(key, emoji) {
    setAfterEmotion(key)
    setBurst(emoji)
    setTimeout(async () => {
      setBurst(null)
      // Bulk insert emotions for the 10 answered
      if (user && beforeEmotion && key && answered.length) {
        const payload = answered.map((a) => ({
          user_id: user.id,
          exercise_id: a.exercise_id,
          emotion_before: beforeEmotion,
          emotion_after: key,
        }))
        await supabase.from('emotions').insert(payload)
      }
      setPhase('summary')
    }, 950)
  }

  async function submitAnswer() {
    if (!current || selectedIdx == null || !user) return
    const selected = current.options[selectedIdx]
    const correct = selected === String(current.answer)

    setSubmitted(true)
    setIsCorrect(correct)

    await supabase.from('exercise_results').insert({
      user_id: user.id,
      exercise_id: current.id,
      is_correct: correct,
    })

    if (correct) {
      await applyGamification({ userId: user.id, isCorrect: true })
    }

    setAnswered((arr) => [...arr, { exercise_id: current.id, is_correct: correct }])
  }

  function nextQuestion() {
    if (index < 9) {
      setIndex(index + 1)
      setSelectedIdx(null)
      setSubmitted(false)
      setIsCorrect(null)
    } else {
      setPhase('emotionAfter')
    }
  }

  function accuracyPct() {
    if (!answered.length) return 0
    const correct = answered.filter((a) => a.is_correct).length
    return Math.round((correct / 10) * 100)
  }

  return (
    <div className="min-h-screen bg-gray-50 bg-grid">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="px-5 py-6 md:px-8 md:py-7 bg-gradient-to-r from-indigo-50 to-white">
            <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">Latihan</h1>
            <p className="text-slate-600 mt-1">Jawab soal matematika dan refleksikan perasaanmu.</p>
          </div>
        </div>
        {phase === 'idle' && user && (
          <div className="space-y-4 mb-6">
            {/* Teacher inline controls */}
            {/** Only render for teacher */}
            {/** Teacher can quickly create a code-based exercise and get the 6-letter code */}
            {/** Also provide link to upload CSV */}
            {/** We use role from AuthContext via isTeacher through Navbar, but we have only user here; fetch will be constrained by RLS anyway. */}
            {/** To avoid blocking, we expose the panel but it will error if user lacks permission. */}
            <TeacherCreateInline />
          </div>
        )}
        {phase === 'idle' && (
        <div className="space-y-4 mb-6">
          <Card>
            <div className="space-y-2">
              <div className="font-medium text-slate-800">Gabung dengan Kode</div>
              <div className="text-sm text-slate-600">Masukkan kode 6 huruf dari guru.</div>
              <JoinWithCode onJoined={(items) => {
                const mapped = (items || []).slice(0, 10).map((q) => {
                  const correct = String(q.correct_answer ?? q.answer ?? '')
                  const hasOptions = Array.isArray(q.options) && q.options.length === 4
                  const opts = hasOptions ? [...q.options] : buildOptions(correct)
                  const shuffledOpts = [...opts].sort(() => Math.random() - 0.5)
                  return {
                    id: q.exercise_id,
                    title: q.title,
                    question_text: q.question_text,
                    difficulty: q.difficulty || 'easy',
                    answer: correct,
                    options: shuffledOpts,
                    visual_meta: deriveVisualizationMeta({ title: q.title, question_text: q.question_text }) || null,
                  }
                })
                setExercises(mapped)
                setIndex(0)
                setSelectedIdx(null)
                setSubmitted(false)
                setIsCorrect(null)
                setAnswered([])
                setPhase('emotionBefore')
              }} />
            </div>
          </Card>
          <Card>
            <div className="space-y-2">
              <div className="font-medium text-slate-800">Latihan Sekarang</div>
              <div className="text-sm text-slate-600">Kerjakan latihan dari bank soal.</div>
              <button onClick={() => setPhase('emotionBefore')} className="rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">Mulai Latihan</button>
            </div>
          </Card>
        </div>
        )}
        {phase !== 'idle' && (
        <Card>
          {/* Progress bar */}
          {phase === 'quiz' && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Progress</span>
                <span>{index + 1} / 10</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-indigo-500 transition-all" style={{ width: `${((index) / 10) * 100}%` }} />
              </div>
            </div>
          )}
          {loading && <div className="text-slate-500">Loading questions...</div>}

          {/* Phase 1: emotionBefore */}
          {!loading && phase === 'emotionBefore' && (
            <div className="space-y-4 relative">
              <div className="text-sm font-medium text-gray-700 mb-2">Bagaimana perasaanmu sebelum mulai sesi?</div>
              <div className="relative">
                <EmotionPicker
                  value={beforeEmotion}
                  onChange={(val) => {
                    const map = { happy: '😊', anxious: '😟', neutral: '😐', frustrated: '😤', excited: '🤩' }
                    handleBeforeSelect(val, map[val] || '🎈')
                  }}
                />
                {burst && <EmojiBurst emoji={burst} onDone={() => setBurst(null)} />}
              </div>
            </div>
          )}

          {/* Phase 2: quiz */}
          {!loading && current && phase === 'quiz' && (
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-700 border border-slate-200">{current.difficulty}</span>
                </div>
                <h2 className="text-xl font-semibold text-slate-900">{current.title}</h2>
                <p className="text-slate-700 whitespace-pre-line">{current.question_text}</p>
              </div>
              {current.visual_meta && (
                <GeometryGraph meta={current.visual_meta} />
              )}

              <FlashcardGrid
                items={current.options.map((o) => ({ label: o }))}
                selectedIndex={selectedIdx}
                disabled={submitted}
                resultIndex={submitted ? current.options.findIndex((o) => o === String(current.answer)) : null}
                onSelect={(idx) => !submitted && setSelectedIdx(idx)}
              />

              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-500">Soal {index + 1} dari 10</div>
                {!submitted ? (
                  <button
                    disabled={selectedIdx == null}
                    onClick={submitAnswer}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-white shadow hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Kirim
                  </button>
                ) : (
                  <div className={"text-sm font-medium " + (isCorrect ? 'text-green-600' : 'text-red-600')}>
                    {isCorrect ? 'Benar' : 'Salah'}
                  </div>
                )}
              </div>

              {submitted && (
                <div className="flex items-center justify-end">
                  <button onClick={nextQuestion} className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-white shadow hover:bg-black">Lanjut</button>
                </div>
              )}
            </div>
          )}

          {/* Phase 3: emotionAfter */}
          {!loading && phase === 'emotionAfter' && (
            <div className="space-y-4 relative">
              <div className="text-sm font-medium text-gray-700 mb-2">Bagaimana perasaanmu setelah selesai?</div>
              <div className="relative">
                <EmotionPicker
                  value={afterEmotion}
                  onChange={(val) => {
                    const map = { happy: '😊', anxious: '😟', neutral: '😐', frustrated: '😤', excited: '🤩' }
                    handleAfterSelect(val, map[val] || '🎈')
                  }}
                />
                {burst && <EmojiBurst emoji={burst} onDone={() => setBurst(null)} />}
              </div>
            </div>
          )}

          {/* Phase 4: summary */}
          {!loading && phase === 'summary' && (
            <div className="space-y-6">
              <div className="text-sm text-slate-600">Kerja bagus! Berikut ringkasan sesi kamu.</div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-end gap-4">
                  <div>
                    <div className="text-sm text-slate-500">Akurasi</div>
                    <div className="text-4xl font-bold text-slate-800">{accuracyPct()}%</div>
                  </div>
                  <div className="flex-1">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full bg-indigo-500" style={{ width: `${accuracyPct()}%` }} />
                    </div>
                    <div className="mt-1 text-xs text-slate-500">Benar: {answered.filter((a) => a.is_correct).length} / 10</div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="text-sm text-slate-500">Emosi</div>
                  <div className="px-3 py-1 rounded-full border border-slate-200 bg-white text-sm">Sebelum: {beforeEmotion || '-'}</div>
                  <div className="px-3 py-1 rounded-full border border-slate-200 bg-white text-sm">Sesudah: {afterEmotion || '-'}</div>
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={() => (window.location.href = '/dashboard')} className="rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">Kembali ke Dashboard</button>
              </div>
            </div>
          )}
        </Card>
        )}
        {/* MOTION ChatBot on Exercises page (hidden during active answering) */}
        {(phase === 'idle' || phase === 'summary') && (
          <div className="mt-8">
            <ChatBot />
          </div>
        )}
      </main>
    </div>
  )
}

import { useState as _useState } from 'react'
import { Link } from 'react-router-dom'
function JoinWithCode({ onJoined }) {
  const [code, setCode] = _useState('')
  const [err, setErr] = _useState(null)
  const [joining, setJoining] = _useState(false)
  async function join() {
    setErr(null)
    const c = code.trim().toUpperCase()
    if (c.length !== 6) { setErr('Kode harus 6 karakter'); return }
    setJoining(true)
    try {
      const { data, error } = await supabase.rpc('join_quiz', { p_code: c })
      if (error) throw error
      if (!data || data.length === 0) { setErr('Kode tidak valid / kuis tidak aktif'); return }
      const items = data.map(r => r.question)
      if (onJoined) onJoined(items)
    } catch (e) {
      setErr(e.message || 'Failed to join')
    } finally {
      setJoining(false)
    }
  }
  return (
    <div className="space-y-2">
      <input maxLength={6} value={code} onChange={(e)=>setCode(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono uppercase tracking-widest" placeholder="ABC123" />
      {err && <div className="text-sm text-red-600">{err}</div>}
      <button disabled={joining} onClick={join} className="rounded-xl bg-indigo-600 px-4 py-2 text-white shadow hover:bg-indigo-700 disabled:opacity-50">Join</button>
    </div>
  )
}

function TeacherCreateInline() {
  const { user, isTeacher } = useAuth()
  const [title, setTitle] = _useState('')
  const [subject, setSubject] = _useState('')
  const [rows, setRows] = _useState([])
  const [selected, setSelected] = _useState(new Set())
  const [creating, setCreating] = _useState(false)
  const [code, setCode] = _useState('')
  const [error, setError] = _useState('')

  useEffect(() => {
    let active = true
    async function load() {
      if (!user || !isTeacher) return
      const { data, error } = await supabase
        .from('exercises')
        .select('id,title,subject,difficulty,created_at')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })
        .limit(30)
      if (!active) return
      if (error) setError(error.message)
      setRows(data || [])
    }
    load()
    return () => { active = false }
  }, [user, isTeacher])

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
    if (!isTeacher) { setError('Only teacher can create'); return }
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
      setError(e.message || 'Failed to create exercise')
      console.error('create_quiz failed', e)
    } finally {
      setCreating(false)
    }
  }

  if (!isTeacher) {
    return null
  }

  return (
    <Card>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-medium text-slate-800">Create Exercise (with Code)</div>
          <Link to="/teacher/upload-csv" className="text-indigo-600 hover:underline text-sm">Upload CSV</Link>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Exercise title" className="rounded-xl border border-slate-200 px-3 py-2" />
          <input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Subject (optional)" className="rounded-xl border border-slate-200 px-3 py-2" />
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div className="max-h-64 overflow-auto border border-slate-200 rounded-xl">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="py-2 px-3">Pick</th>
                <th className="py-2 px-3">Title</th>
                <th className="py-2 px-3">Diff</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="py-2 px-3"><input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} /></td>
                  <td className="py-2 px-3 text-slate-800">{r.title}</td>
                  <td className="py-2 px-3 capitalize">{r.difficulty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-3">
          <button disabled={creating} onClick={createQuiz} className="rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50">{creating ? 'Creating…' : 'Create Code'}</button>
          {code && <span className="text-sm">Share code: <span className="font-semibold">{code}</span></span>}
        </div>
      </div>
    </Card>
  )
}