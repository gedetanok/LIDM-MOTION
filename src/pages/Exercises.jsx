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
import { EmojiBurst } from '../components/emoji/EmojiBurst'

export default function Exercises() {
  const { user } = useAuth()

  // Phase: 'emotionBefore' | 'quiz' | 'emotionAfter' | 'summary'
  const [phase, setPhase] = useState('emotionBefore')

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
        .select('id,title,question_text,answer,difficulty,visual_meta')
        .limit(limit)
      if (difficulty) q = q.eq('difficulty', difficulty)
      const { data, error } = await q
      if (error) {
        setExercises([])
        setLoading(false)
        return
      }
      const shuffled = [...(data || [])].sort(() => Math.random() - 0.5)
      const picked = shuffled.slice(0, 10).map((e) => ({
        ...e,
        options: buildOptions(String(e.answer)),
        visual_meta: e.visual_meta || deriveVisualizationMeta(e) || null,
      }))
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
      await supabase.from('users').update({ points: (current) => (current ?? 0) + 10 }).eq('id', user.id)
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4">Exercises</h1>
        <Card>
          {loading && <div className="text-gray-500">Loading questions...</div>}

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
            <div className="space-y-4">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">{current.difficulty}</div>
                <h2 className="text-lg font-medium text-gray-800">{current.title}</h2>
                <p className="text-gray-700 mt-1 whitespace-pre-line">{current.question_text}</p>
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
                <div className="text-sm text-gray-500">Question {index + 1} of 10</div>
                {!submitted ? (
                  <button
                    disabled={selectedIdx == null}
                    onClick={submitAnswer}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl px-4 py-2"
                  >
                    Submit
                  </button>
                ) : (
                  <div className={"text-sm font-medium " + (isCorrect ? 'text-green-600' : 'text-red-600')}>
                    {isCorrect ? 'Correct' : 'Incorrect'}
                  </div>
                )}
              </div>

              {submitted && (
                <div className="flex items-center justify-end">
                  <button onClick={nextQuestion} className="bg-gray-900 hover:bg-black text-white rounded-xl px-4 py-2">Next</button>
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
              <div className="text-sm text-slate-600">Great work! Here’s your session summary.</div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-end gap-4">
                  <div>
                    <div className="text-sm text-slate-500">Accuracy</div>
                    <div className="text-4xl font-bold text-slate-800">{accuracyPct()}%</div>
                  </div>
                  <div className="flex-1">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full bg-indigo-500" style={{ width: `${accuracyPct()}%` }} />
                    </div>
                    <div className="mt-1 text-xs text-slate-500">Correct: {answered.filter((a) => a.is_correct).length} / 10</div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="text-sm text-slate-500">Emotions</div>
                  <div className="px-3 py-1 rounded-full border border-slate-200 bg-white text-sm">Before: {beforeEmotion || '-'}</div>
                  <div className="px-3 py-1 rounded-full border border-slate-200 bg-white text-sm">After: {afterEmotion || '-'}</div>
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={() => (window.location.href = '/dashboard')} className="rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">Back to Dashboard</button>
              </div>
            </div>
          )}
        </Card>
      </main>
    </div>
  )
}