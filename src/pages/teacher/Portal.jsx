import { useEffect, useMemo, useState } from 'react'
import Navbar from '../../components/Navbar'
import Card from '../../components/Card'
import { ResponsiveTable } from '../../components/ui/ResponsiveTable'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function TeacherPortal() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ questions: 0, quizzes: 0 })
  const [rows, setRows] = useState([])
  const [loadingRows, setLoadingRows] = useState(false)

  async function loadStats() {
    const [{ count: qCount }, { count: zCount }] = await Promise.all([
      supabase.from('exercises').select('id', { count: 'exact', head: true }).eq('created_by', user.id),
      supabase.from('quizzes').select('id', { count: 'exact', head: true }).eq('created_by', user.id)
    ])
    setStats({ questions: qCount || 0, quizzes: zCount || 0 })
  }

  async function loadRows() {
    setLoadingRows(true)
    const { data } = await supabase
      .from('exercises')
      .select('id,title,subject,difficulty,is_published,created_at')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })
      .limit(100)
    setRows(data || [])
    setLoadingRows(false)
  }

  useEffect(() => {
    if (!user) return
    loadStats();
    loadRows();
  }, [user])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="px-5 py-6 md:px-8 md:py-7 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-indigo-50 to-white">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-slate-800">Portal Guru</h1>
              <p className="text-slate-600 mt-1">Kelola soal dan kuis dalam satu halaman.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div className="text-xs text-slate-500">Soal</div>
                <div className="text-xl font-semibold text-slate-800">{stats.questions}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div className="text-xs text-slate-500">Kuis</div>
                <div className="text-xl font-semibold text-slate-800">{stats.quizzes}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Create Quiz */}
        <section className="space-y-6">
          <h2 className="text-lg font-medium text-slate-800">Buat Kuis</h2>
          <CreateQuiz onAfterChange={() => { loadStats(); loadRows() }} />

          {/* Create Question */}
          <Card title="Buat Soal">
            <CreateQuestion onCreated={() => { loadStats(); loadRows() }} />
          </Card>

          {/* Import from CSV */}
          <Card title="Import dari CSV">
            <ImportCsv onImported={() => { loadStats(); loadRows() }} />
          </Card>
        </section>

        {/* List of Question */}
        <section className="mt-8">
          <h2 className="text-lg font-medium text-slate-800 mb-3">Daftar Soal</h2>
          <Card>
            {loadingRows ? (
              <div className="text-slate-500">Memuat…</div>
            ) : rows.length === 0 ? (
              <div className="text-slate-500">Belum ada soal.</div>
            ) : (
              <ResponsiveTable
                columns={[
                  { key: 'title', header: 'Judul' },
                  { key: 'subject', header: 'Mapel', render: (v)=> v || '-' },
                  { key: 'difficulty', header: 'Tingkat', render: (v)=> String(v).toLowerCase() },
                  { key: 'is_published', header: 'Publik', render: (_v, row)=> (<TogglePublish id={row.id} value={row.is_published} onChanged={(v)=> setRows(r=>r.map(x=>x.id===row.id?{...x,is_published:v}:x))} />) },
                  { key: 'created_at', header: 'Dibuat', render: (v)=> new Date(v).toLocaleString() },
                ]}
                rows={rows}
              />
            )}
          </Card>
        </section>
      </main>
    </div>
  )
}

function TogglePublish({ id, value, onChanged }){
  async function toggle(){
    await supabase.from('exercises').update({ is_published: !value }).eq('id', id)
    onChanged && onChanged(!value)
  }
  return (
    <button onClick={toggle} className={(value ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700') + ' px-2 py-1 rounded text-xs'}>
      {value ? 'Publik' : 'Draft'}
    </button>
  )
}

function CreateQuestion({ onCreated }){
  const [form, setForm] = useState({ title:'', subject:'', difficulty:'easy', question_text:'', options:['','','',''], correct_answer:'', is_published:true })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  function updateOption(i, v){ setForm(f=>{ const n=[...f.options]; n[i]=v; return { ...f, options:n } }) }
  async function onSubmit(e){ e.preventDefault(); setError(''); const filled=form.options.map(o=>String(o||'').trim()).filter(Boolean); if(!form.title.trim()||!form.question_text.trim()) return setError('Judul dan pertanyaan wajib diisi'); if(filled.length!==4) return setError('Harus ada 4 opsi'); if(!filled.includes(form.correct_answer)) return setError('Jawaban benar harus salah satu opsi'); setSaving(true); const payload={ title:form.title.trim(), subject:form.subject.trim()||null, difficulty:form.difficulty, question_text:form.question_text, options:form.options.map(String), correct_answer:String(form.correct_answer), answer:String(form.correct_answer), is_published:!!form.is_published }; const { error } = await supabase.from('exercises').insert(payload); setSaving(false); if(error) setError(error.message); else { setForm({ title:'', subject:'', difficulty:'easy', question_text:'', options:['','','',''], correct_answer:'', is_published:true }); onCreated && onCreated() } }
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Judul</label>
          <input value={form.title} onChange={e=>setForm({ ...form, title:e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Mapel</label>
          <input value={form.subject} onChange={e=>setForm({ ...form, subject:e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Tingkat</label>
          <select value={form.difficulty} onChange={e=>setForm({ ...form, difficulty:e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2"><option value="easy">easy</option><option value="medium">medium</option><option value="hard">hard</option></select>
        </div>
      </div>
      <div>
        <label className="block text-sm text-slate-600 mb-1">Pertanyaan</label>
        <textarea value={form.question_text} onChange={e=>setForm({ ...form, question_text:e.target.value })} rows={5} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
      </div>
      <div>
        <div className="text-sm text-slate-600 mb-1">Pilihan (MCQ)</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {form.options.map((opt, idx) => (
            <input key={idx} value={opt} onChange={e=>updateOption(idx, e.target.value)} placeholder={`Opsi ${idx+1}`} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
          ))}
        </div>
        <div className="mt-3">
          <label className="block text-sm text-slate-600 mb-1">Jawaban Benar</label>
          <select value={form.correct_answer} onChange={e=>setForm({ ...form, correct_answer:e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2">
            <option value="">-- pilih --</option>
            {form.options.map((o,i)=>(<option key={i} value={o}>{o}</option>))}
          </select>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input id="publish" type="checkbox" checked={form.is_published} onChange={e=>setForm({ ...form, is_published:e.target.checked })} />
        <label htmlFor="publish" className="text-sm text-slate-700">Publik</label>
      </div>
      <div className="flex justify-end">
        <button disabled={saving} className="rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50">Simpan Soal</button>
      </div>
    </form>
  )
}

function CreateQuiz({ onAfterChange }){
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [rows, setRows] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [creating, setCreating] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  useEffect(()=>{ (async()=>{ const { data } = await supabase.from('exercises').select('id,title,difficulty,subject').order('created_at',{ascending:false}).limit(50); setRows(data||[]) })() },[])
  function toggle(id){ setSelected(prev=>{ const n=new Set(prev); if(n.has(id)) n.delete(id); else if(n.size<10) n.add(id); return n }) }
  async function create(){ setError(''); if(!title.trim()) { setError('Judul wajib'); return } if(selected.size===0){ setError('Pilih minimal 1 soal'); return } setCreating(true); const ids=Array.from(selected); const { data, error } = await supabase.rpc('create_quiz',{ p_title:title.trim(), p_subject:subject||null, p_exercise_ids:ids }); setCreating(false); if(error) setError(error.message); else { setCode(data.code); onAfterChange && onAfterChange() } }
  return (
    <Card>
      <div className="grid gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Judul Kuis</label>
            <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Mapel (opsional)</label>
            <input value={subject} onChange={e=>setSubject(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
          </div>
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div>
          <div className="text-sm text-slate-600 mb-2">Pilih sampai 10 soal</div>
          <div className="max-h-72 overflow-auto border border-slate-200 rounded-xl">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 text-left text-slate-500"><tr><th className="py-2 px-3">Pilih</th><th className="py-2 px-3">Judul</th><th className="py-2 px-3">Tingkat</th><th className="py-2 px-3">Mapel</th></tr></thead>
              <tbody>
                {rows.map(r=> (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="py-2 px-3"><input type="checkbox" checked={selected.has(r.id)} onChange={()=>toggle(r.id)} /></td>
                    <td className="py-2 px-3 text-slate-800">{r.title}</td>
                    <td className="py-2 px-3 capitalize">{r.difficulty}</td>
                    <td className="py-2 px-3">{r.subject||'-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-xs text-slate-500 mt-1">Dipilih {selected.size}/10</div>
        </div>
        <div className="flex items-center gap-3">
          <button disabled={creating} onClick={create} className="rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50">{creating?'Membuat…':'Buat Kode Kuis'}</button>
          {code && <span className="text-sm">Kode: <span className="font-semibold">{code}</span></span>}
        </div>
      </div>
    </Card>
  )
}

function ImportCsv({ onImported }){
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState([])
  const [loading, setLoading] = useState(false)
  async function parse(){ if(!file) return; const Papa=(await import('papaparse')).default; setLoading(true); Papa.parse(file,{ header:true, skipEmptyLines:true, complete:(res)=>{ setPreview(res.data||[]); setLoading(false) } }) }
  async function doImport(){ if(!file) return; const Papa=(await import('papaparse')).default; setLoading(true); Papa.parse(file,{ header:true, skipEmptyLines:true, complete: async (res)=> { const rows=(res.data||[]).map(r=>{ let options=null; try{ options=r.options?JSON.parse(r.options):null }catch{ options=null } const correct=r.correct_answer??r.answer; return { title:r.title?.trim(), subject:r.subject?.trim(), question_text:r.question_text, answer:String(correct), difficulty:(r.difficulty||'easy').toLowerCase(), options, correct_answer:String(correct), is_published:String(r.is_published??'true').toLowerCase()!=='false' } }); const valid=rows.filter(x=> x.title&&x.question_text&&x.correct_answer&& (!x.options||(Array.isArray(x.options)&&x.options.length===4&&x.options.includes(x.correct_answer)))); const { error } = await supabase.from('exercises').insert(valid); setLoading(false); if(error) alert(error.message); else { alert(`Imported ${valid.length} exercises`); setPreview([]); setFile(null); onImported && onImported() } } }) }
  return (
    <div>
      <div className="flex items-center gap-3">
        <input type="file" accept=".csv" onChange={(e)=>{ setPreview([]); setFile(e.target.files?.[0]||null) }} />
        <button onClick={parse} disabled={!file||loading} className="rounded-xl border border-slate-200 bg-white px-4 py-2 hover:bg-slate-50 disabled:opacity-50">Preview</button>
        <button onClick={doImport} disabled={!file||loading} className="rounded-xl bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700 disabled:opacity-50">Import</button>
      </div>
      {preview.length>0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-slate-500"><tr>{Object.keys(preview[0]).map(h=>(<th key={h} className="py-2 pr-4">{h}</th>))}</tr></thead>
            <tbody>
              {preview.slice(0,10).map((r,i)=> (
                <tr key={i} className="border-t border-slate-100">
                  {Object.keys(preview[0]).map(h=>(<td key={h} className="py-2 pr-4">{String(r[h])}</td>))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

