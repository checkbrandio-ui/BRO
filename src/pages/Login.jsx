import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Lock, Mail, Eye, EyeOff, ArrowRight, UserPlus, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Login() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const nextUrl   = new URLSearchParams(location.search).get('next') || '/admin/agencies';

  const [mode, setMode]             = useState('login');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');

  const reset = () => { setError(''); setSuccess(''); };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Введите email и пароль'); return; }
    setLoading(true); reset();
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      navigate(nextUrl, { replace: true });
    } catch {
      setError('Неверный email или пароль');
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email || !password || !confirmPwd) { setError('Заполните все поля'); return; }
    if (password !== confirmPwd) { setError('Пароли не совпадают'); return; }
    if (password.length < 6) { setError('Пароль должен быть не менее 6 символов'); return; }
    setLoading(true); reset();
    try {
      await base44.auth.register({ email, password });
      // Пробуем сразу залогиниться
      try {
        await base44.auth.loginViaEmailPassword(email, password);
        navigate(nextUrl, { replace: true });
      } catch {
        setSuccess('Аккаунт создан! Войдите с вашими данными.');
        setMode('login');
        setPassword(''); setConfirmPwd('');
      }
    } catch (err) {
      const msg = err?.message || '';
      if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exists')) {
        setError('Этот email уже зарегистрирован');
      } else {
        setError('Ошибка регистрации. Попробуйте позже.');
      }
    }
    setLoading(false);
  };

  const inputClass = "w-full pl-10 pr-4 py-3.5 bg-[rgba(255,255,255,0.04)] border border-[rgba(123,63,191,0.25)] rounded-xl text-sm text-[#F8FAFC] placeholder:text-[#F8FAFC]/20 focus:outline-none focus:border-[#7B3FBF] focus:ring-1 focus:ring-[#7B3FBF]/30 transition-all";

  return (
    <div className="min-h-screen bg-[#05070A] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(123,63,191,0.15) 0%, transparent 60%)' }} className="absolute inset-0" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(123,63,191,0.4)] to-transparent" />
      </div>
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(rgba(123,63,191,1) 1px, transparent 1px), linear-gradient(90deg, rgba(123,63,191,1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-[#7B3FBF] via-[#C9A84C] to-[#7B3FBF]" />
          <div className="p-8 md:p-10">
            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <div className="flex items-center gap-3 mb-4">
                <img src="https://media.base44.com/images/public/user_69f4a60c5f6a1719d380566c/86d4247bb_2_2.png" alt="logo" className="w-12 h-12 object-contain" />
                <img src="https://media.base44.com/images/public/user_69f4a60c5f6a1719d380566c/aed774101_2_1.png" alt="БРО-СНБ" className="h-8 object-contain" style={{ filter: 'invert(1) brightness(2)' }} />
              </div>
              <p className="text-xs text-[#F8FAFC]/35 text-center">Система управления кадровыми агентствами</p>
            </div>

            {/* Tabs */}
            <div className="flex rounded-xl bg-[rgba(255,255,255,0.04)] p-1 mb-7">
              {[
                { key: 'login', label: 'Войти', Icon: LogIn },
                { key: 'register', label: 'Зарегистрироваться', Icon: UserPlus },
              ].map(({ key, label, Icon }) => (
                <button key={key} onClick={() => { setMode(key); reset(); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === key ? 'bg-[#7B3FBF] text-white shadow-lg' : 'text-[#F8FAFC]/40 hover:text-[#F8FAFC]/70'}`}>
                  <Icon size={14} />{label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={mode} initial={{ opacity: 0, x: mode === 'login' ? -10 : 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-xs text-[#F8FAFC]/40 mb-2">Email</label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#F8FAFC]/30" />
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className={inputClass} autoComplete="email" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-[#F8FAFC]/40 mb-2">Пароль</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#F8FAFC]/30" />
                      <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className={inputClass + ' pr-10'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#F8FAFC]/30 hover:text-[#F8FAFC]/60 transition-colors">
                        {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {mode === 'register' && (
                    <div>
                      <label className="block text-xs text-[#F8FAFC]/40 mb-2">Подтвердите пароль</label>
                      <div className="relative">
                        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#F8FAFC]/30" />
                        <input type={showPass ? 'text' : 'password'} value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="••••••••" className={inputClass} autoComplete="new-password" />
                      </div>
                      <p className="text-xs text-[#F8FAFC]/25 mt-1.5">После регистрации администратор назначит вам права доступа</p>
                    </div>
                  )}

                  {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-center">{error}</div>}
                  {success && <div className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3 text-center">{success}</div>}

                  <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#7B3FBF] hover:bg-[#8B4FCF] text-white text-sm font-bold transition-all shadow-[0_0_30px_rgba(123,63,191,0.3)] disabled:opacity-60 disabled:cursor-not-allowed mt-2">
                    {loading
                      ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <><span>{mode === 'login' ? 'Войти' : 'Создать аккаунт'}</span><ArrowRight size={16} /></>
                    }
                  </motion.button>
                </form>
              </motion.div>
            </AnimatePresence>

            <div className="mt-6 pt-5 border-t border-[rgba(123,63,191,0.12)] text-center">
              <p className="text-xs text-[#F8FAFC]/20">ООО «БРО-СНБ» · bratouverie-snb.ru</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}