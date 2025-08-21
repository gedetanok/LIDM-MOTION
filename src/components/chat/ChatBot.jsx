import { useRef, useState, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

export default function ChatBot() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hai, aku MOTION. Tanyakan apa saja tentang matematika atau bagikan perasaanmu hari ini.' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const listRef = useRef(null)

  async function sendMessage(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text) return
    const next = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('motion-chat', {
        body: { messages: next.slice(-10) },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      const reply = data?.reply || 'Maaf, aku tidak bisa merespons sekarang.'
      setMessages((m) => [...m, { role: 'assistant', content: reply }])
      setTimeout(() => listRef.current?.scrollTo({ top: 999999, behavior: 'smooth' }), 0)
    } catch (err) {
      const msg = err?.message || String(err)
      setMessages((m) => [...m, { role: 'assistant', content: `Terjadi masalah saat merespons: ${msg}` }])
      // eslint-disable-next-line no-console
      console.error('[motion-chat]', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl bg-white shadow-lg">
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="font-semibold text-slate-800">Asisten MOTION</div>
      </div>
      <div ref={listRef} className="h-96 sm:h-[28rem] lg:h-[18rem] overflow-auto px-4 py-3 space-y-2">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div className={(m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-800') + ' rounded-2xl px-3 py-2 max-w-[85%]'}>
              {m.role === 'user' ? (
                <span className="whitespace-pre-wrap">{m.content}</span>
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  className="prose prose-slate max-w-none prose-p:my-2 prose-ol:my-2 prose-ul:my-2 prose-li:my-0"
                >
                  {normalizeTeXDelimiters(m.content)}
                </ReactMarkdown>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 text-slate-800 rounded-2xl px-3 py-2 text-sm animate-pulse">Thinking…</div>
          </div>
        )}
      </div>
      <form onSubmit={sendMessage} className="px-3 pb-3">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tanyakan matematika atau bagikan perasaanmu…"
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          />
          <button disabled={loading} className="rounded-xl bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700 disabled:opacity-50">Kirim</button>
        </div>
      </form>
    </div>
  )
}

// Some providers return LaTeX escaped like \\( ... \\) or with single $ ... $
// This helper normalizes common variants to remark-math friendly syntax
function normalizeTeXDelimiters(text) {
  if (!text) return ''
  let out = String(text)
  // Convert escaped \( ... \) to $...$
  out = out.replace(/\\\((.*?)\\\)/gs, '$$$1$$')
  // Convert escaped \[ ... \] to $$...$$ (block)
  out = out.replace(/\\\[(.*?)\\\]/gs, '$$$$ $1 $$$$')
  // Ensure inline math with single $ does not break across spaces
  return out
}

