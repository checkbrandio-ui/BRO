import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { RefreshCw, Search, X, Ticket, CheckCircle, Send } from 'lucide-react';

const PRIORITY_COLORS = {
  low: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  high: 'text-red-400 bg-red-400/10 border-red-400/20',
};
const PRIORITY_LABELS = { low: 'Низкий', medium: 'Средний', high: 'Высокий' };
const STATUS_COLORS = {
  open: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  answered: 'text-green-400 bg-green-400/10 border-green-400/20',
  closed: 'text-[#F8FAFC]/40 bg-white/5 border-white/10',
};
const STATUS_LABELS = { open: 'Открыт', answered: 'Ответ дан', closed: 'Закрыт' };

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU') + ' ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [answeringId, setAnsweringId] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.AgentTicket.list('-created_date', 200);
    setTickets(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    base44.auth.me().then(u => setCurrentUser(u)).catch(() => {});
  }, []);

  const handleAnswer = async (ticket) => {
    if (!answerText.trim()) return;
    setSubmitting(true);
    try {
      await base44.entities.AgentTicket.update(ticket.id, {
        status: 'answered',
        answer: answerText.trim(),
        answered_by: currentUser?.full_name || currentUser?.email || 'Администратор',
      });
      setAnsweringId(null);
      setAnswerText('');
      load();
    } catch (e) {
      alert('Ошибка: ' + e.message);
    }
    setSubmitting(false);
  };

  const handleClose = async (ticket) => {
    await base44.entities.AgentTicket.update(ticket.id, { status: 'closed' });
    load();
  };

  const filtered = tickets.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !q || t.question?.toLowerCase().includes(q) || t.asked_by_name?.toLowerCase().includes(q);
    const matchStatus = !filterStatus || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const inp = "px-3 py-2 bg-[rgba(255,255,255,0.04)] border border-[rgba(123,63,191,0.2)] rounded-lg text-sm text-[#F8FAFC] focus:outline-none focus:border-[#7B3FBF]";

  return (
    <div className="min-h-screen bg-[#05070A] text-[#F8FAFC]">
      <div className="border-b border-[rgba(123,63,191,0.15)] bg-[#05070A]/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 text-[#F8FAFC]/50 hover:text-[#F8FAFC] transition-colors">
              <img src="https://media.base44.com/images/public/user_69f4a60c5f6a1719d380566c/86d4247bb_2_2.png" className="w-7 h-7 object-contain" alt="logo" />
            </Link>
            <span className="text-[rgba(123,63,191,0.4)]">/</span>
            <Link to="/admin/assistant" className="text-sm text-[#F8FAFC]/50 hover:text-[#7B3FBF] transition-colors">ИИ-помощник</Link>
            <span className="text-[rgba(123,63,191,0.4)]">/</span>
            <h1 className="text-sm font-bold text-[#F8FAFC]">Тикеты</h1>
          </div>
          <button onClick={load} className="p-2 rounded-lg border border-[rgba(123,63,191,0.2)] text-[#F8FAFC]/50 hover:text-[#7B3FBF] hover:border-[#7B3FBF]/40 transition-all">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-6 py-6">
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#F8FAFC]/30" />
            <input type="text" placeholder="Поиск по вопросу или автору..."
              value={search} onChange={e => setSearch(e.target.value)}
              className={inp + ' w-full pl-9'} />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={inp}>
            <option value="">Все статусы</option>
            <option value="open">Открыт</option>
            <option value="answered">Ответ дан</option>
            <option value="closed">Закрыт</option>
          </select>
          {(search || filterStatus) && (
            <button onClick={() => { setSearch(''); setFilterStatus(''); }}
              className="flex items-center gap-1 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
              <X size={12}/> Сбросить
            </button>
          )}
        </div>

        <div className="text-xs text-[#F8FAFC]/30 mb-4">
          Всего: {tickets.length} · Открытых: {tickets.filter(t => t.status === 'open').length} · Отвеченных: {tickets.filter(t => t.status === 'answered').length}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-[#7B3FBF]/30 border-t-[#7B3FBF] rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Ticket size={40} className="text-[#F8FAFC]/15 mx-auto mb-4" />
            <p className="text-[#F8FAFC]/30 text-sm">Тикетов пока нет</p>
            <p className="text-[#F8FAFC]/20 text-xs mt-1">ИИ-помощник будет создавать тикеты при вопросах от менеджеров, требующих участия администратора</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(t => (
              <div key={t.id} className="glass-card rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${STATUS_COLORS[t.status] || ''}`}>
                        {STATUS_LABELS[t.status] || t.status}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${PRIORITY_COLORS[t.priority] || ''}`}>
                        {PRIORITY_LABELS[t.priority] || t.priority}
                      </span>
                      {t.category && <span className="text-[10px] text-[#F8FAFC]/40">{t.category}</span>}
                    </div>
                    <p className="text-sm text-[#F8FAFC] font-medium">{t.question}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#F8FAFC]/35 mb-3">
                  <span>От: {t.asked_by_name || '—'}</span>
                  <span>·</span>
                  <span>{formatDate(t.created_date)}</span>
                </div>

                {t.status === 'answered' && t.answer && (
                  <div className="mt-2 px-3 py-2 rounded-lg bg-green-500/8 border border-green-500/20 text-xs text-green-400/80">
                    <strong>Ответ:</strong> {t.answer}
                    {t.answered_by && <span className="text-[#F8FAFC]/30 ml-2">— {t.answered_by}</span>}
                  </div>
                )}

                {answeringId === t.id ? (
                  <div className="mt-3 space-y-2">
                    <textarea
                      autoFocus
                      value={answerText}
                      onChange={e => setAnswerText(e.target.value)}
                      placeholder="Введите ответ..."
                      rows={2}
                      className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(123,63,191,0.3)] rounded-lg px-3 py-2 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#7B3FBF] resize-none"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => handleAnswer(t)} disabled={submitting || !answerText.trim()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7B3FBF] text-white text-xs font-bold hover:bg-[#8B4FCF] disabled:opacity-30 transition-all">
                        {submitting ? '...' : <><Send size={11}/> Отправить</>}
                      </button>
                      <button onClick={() => { setAnsweringId(null); setAnswerText(''); }}
                        className="px-3 py-1.5 rounded-lg border border-white/10 text-[#F8FAFC]/40 text-xs hover:text-[#F8FAFC] transition-all">
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  t.status !== 'closed' && (
                    <div className="flex gap-2 mt-2">
                      {t.status === 'open' && (
                        <button onClick={() => { setAnsweringId(t.id); setAnswerText(''); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[rgba(123,63,191,0.25)] text-[#7B3FBF] text-xs hover:bg-[#7B3FBF]/10 transition-all">
                          <CheckCircle size={11}/> Ответить
                        </button>
                      )}
                      {t.status === 'answered' && (
                        <button onClick={() => handleClose(t)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-[#F8FAFC]/40 text-xs hover:text-[#F8FAFC] transition-all">
                          Закрыть тикет
                        </button>
                      )}
                    </div>
                  )
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}