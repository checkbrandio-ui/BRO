import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogIn } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const NAV_LINKS = [
  { label: 'О компании', anchor: 'about' },
  { label: 'Проекты', anchor: 'projects' },
  { label: 'Услуги', anchor: 'services' },
  { label: 'Документы', anchor: 'documents' },
  { label: 'Команда', anchor: 'team' },
  { label: 'Контакты', anchor: 'contacts' },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleAnchor = (anchor) => {
    setOpen(false);
    if (location.pathname === '/') {
      document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/');
      setTimeout(() => {
        document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#05070A]/95 backdrop-blur-xl border-b border-[rgba(123,63,191,0.15)] shadow-lg' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src="https://media.base44.com/images/public/user_69f4a60c5f6a1719d380566c/86d4247bb_2_2.png"
            alt="Братоуверие-СНБ"
            className="w-9 h-9 object-contain"
          />
          <img
            src="https://media.base44.com/images/public/user_69f4a60c5f6a1719d380566c/aed774101_2_1.png"
            alt="Bratouverie"
            className="h-6 object-contain hidden sm:block"
            style={{ filter: 'invert(1) brightness(2)' }}
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {NAV_LINKS.map((l) => (
            <button
              key={l.anchor}
              onClick={() => handleAnchor(l.anchor)}
              className="text-sm text-[#F8FAFC]/60 hover:text-[#F8FAFC] transition-colors"
            >
              {l.label}
            </button>
          ))}
          <Link to="/blog" className="text-sm text-[#F8FAFC]/60 hover:text-[#C9A84C] transition-colors">Блог</Link>
        </nav>

        {/* CTA */}
        <div className="hidden lg:flex items-center gap-3">
          {user ? (
            <>
              {(user.role === 'admin') && (
                <Link to="/admin/agencies" className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[rgba(123,63,191,0.35)] text-[#7B3FBF] text-sm font-bold hover:bg-[#7B3FBF]/10 transition-all">
                  Управление
                </Link>
              )}
              <button onClick={() => base44.auth.logout()} className="text-sm text-[#F8FAFC]/50 hover:text-[#F8FAFC] transition-colors">
                Выйти
              </button>
            </>
          ) : (
            <button onClick={() => base44.auth.redirectToLogin()} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[rgba(123,63,191,0.35)] text-[#7B3FBF] text-sm font-bold hover:bg-[#7B3FBF]/10 transition-all">
              <LogIn size={15} /> Войти
            </button>
          )}
          <button
            onClick={() => handleAnchor('contacts')}
            className="px-5 py-2 rounded-lg bg-[#7B3FBF] hover:bg-[#8B4FCF] text-white text-sm font-bold transition-all duration-300 shadow-[0_0_20px_rgba(123,63,191,0.3)]"
          >
            Стать партнёром
          </button>
        </div>

        {/* Mobile burger */}
        <button onClick={() => setOpen(!open)} className="lg:hidden p-2 text-[#F8FAFC]/70 hover:text-[#F8FAFC]">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden bg-[#05070A]/98 backdrop-blur-xl border-t border-[rgba(123,63,191,0.15)] px-6 py-5 space-y-3">
          {NAV_LINKS.map((l) => (
            <button
              key={l.anchor}
              onClick={() => handleAnchor(l.anchor)}
              className="block w-full text-left text-sm text-[#F8FAFC]/70 hover:text-[#F8FAFC] py-2 transition-colors"
            >
              {l.label}
            </button>
          ))}
          <Link to="/blog" onClick={() => setOpen(false)} className="block text-sm text-[#F8FAFC]/70 hover:text-[#C9A84C] py-2 transition-colors">Блог</Link>
          {user ? (
            <>
              {user.role === 'admin' && (
                <Link to="/admin/agencies" onClick={() => setOpen(false)} className="block text-sm text-[#7B3FBF] font-bold py-2">Управление</Link>
              )}
              <button onClick={() => base44.auth.logout()} className="block text-sm text-[#F8FAFC]/50 py-2 w-full text-left">Выйти</button>
            </>
          ) : (
            <button onClick={() => base44.auth.redirectToLogin()} className="flex items-center gap-2 text-sm text-[#7B3FBF] font-bold py-2">
              <LogIn size={14} /> Войти
            </button>
          )}
          <button
            onClick={() => handleAnchor('contacts')}
            className="w-full mt-2 px-5 py-3 rounded-lg bg-[#7B3FBF] text-white text-sm font-bold"
          >
            Стать партнёром
          </button>
        </div>
      )}
    </header>
  );
}