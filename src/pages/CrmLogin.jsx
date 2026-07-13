import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setCrmAdmin } from '@/lib/crmSession';
import { KeyRound, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.bro-crm.ru';

export default function CrmLogin() {
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = accessCode.trim();

    if (!code) {
      setError('Введите код доступа');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/auth/crm-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_code: code }),
      });

      const json = await res.json();

      if (!res.ok || !json.data?.admin) {
        setError(json.error || 'Неверный код доступа или аккаунт деактивирован.');
        return;
      }

      const admin = json.data.admin;
      if (json.data.token) localStorage.setItem('base44_access_token', json.data.token);
      setCrmAdmin({ id: admin.id, full_name: admin.full_name, role: admin.role });

      const next = searchParams.get('next') || '/admin/candidates';
      navigate(next);
    } catch (err) {
      setError('Ошибка соединения с сервером: ' + (err?.message || 'попробуйте позже'));
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    setAccessCode(e.target.value);
    if (error) setError('');
  };

  return (
    <div className="min-h-screen bg-[#05070A] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(201,168,76,0.10) 0%, transparent 60%)' }} className="absolute inset-0" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(201,168,76,0.4)] to-transparent" />
      </div>
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(rgba(201,168,76,1) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <div className="glass-card-gold rounded-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-[#C9A84C] via-[#7B3FBF] to-[#C9A84C]" />
          <div className="p-8 md:p-10">
            <div className="flex flex-col items-center mb-8">
              <div className="flex items-center gap-3 mb-5">
                <img src="https://media.base44.com/images/public/user_69f4a60c5f6a1719d380566c/86d4247bb_2_2.png" alt="logo" className="w-12 h-12 object-contain" />
                <img src="https://media.base44.com/images/public/user_69f4a60c5f6a1719d380566c/aed774101_2_1.png" alt="БРО-СНБ" className="h-8 object-contain" style={{ filter: 'invert(1) brightness(2)' }} />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={18} className="text-[#C9A84C]" />
                <h1 className="text-xl font-black text-[#F8FAFC]">Вход в CRM</h1>
              </div>
              <p className="text-xs text-[#F8FAFC]/35 text-center">Введите секретный код администратора</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-[#F8FAFC]/40 mb-2">Код доступа</label>
                <div className="relative">
                  <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#F8FAFC]/30" />
                  <input
                    type="text"
                    name="access_code"
                    placeholder="BRO-ADMIN-XXXX"
                    value={accessCode}
                    onChange={handleCodeChange}
                    autoComplete="off"
                    className="w-full pl-10 pr-4 py-3.5 bg-[rgba(255,255,255,0.04)] border border-[rgba(201,168,76,0.25)] rounded-xl text-sm text-[#F8FAFC] placeholder:text-[#F8FAFC]/20 focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/30 transition-all tracking-widest text-center font-mono"
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-center">
                  {error}
                </div>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#C9A84C] hover:bg-[#D9B85C] text-[#05070A] text-sm font-bold transition-all shadow-[0_0_30px_rgba(201,168,76,0.3)] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {loading
                  ? <div className="w-4 h-4 border-2 border-[#05070A]/30 border-t-[#05070A] rounded-full animate-spin" />
                  : <><span>Войти</span><ArrowRight size={16} /></>
                }
              </motion.button>
            </form>

            <div className="mt-6 pt-5 border-t border-[rgba(201,168,76,0.12)] text-center">
              <p className="text-xs text-[#F8FAFC]/20">ООО «БРО-СНБ» · bratouverie-snb.ru</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
