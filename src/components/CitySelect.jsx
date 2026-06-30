import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { MapPin, Loader2 } from 'lucide-react';

/**
 * Компонент автодополнения городов.
 * Использует backend-функцию searchCities (Nominatim + локальный кэш City).
 *
 * @param {string} value — текущее значение (название города)
 * @param {function} onChange — вызывается с названием города при выборе или ручном вводе
 * @param {string} inputClassName — CSS-классы для input (наследуются от родительской формы)
 * @param {string} placeholder
 * @param {boolean} readOnly
 * @param {string} dropdownClassName — опциональный класс для dropdown (по умолчанию тёмная тема)
 */
export default function CitySelect({
  value,
  onChange,
  inputClassName = '',
  placeholder = 'Начните вводить город...',
  readOnly = false,
  dropdownClassName = '',
}) {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  // Синхронизируем внешнее значение
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Закрытие dropdown при клике вне компонента
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = async (q) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const resp = await base44.functions.invoke('searchCities', { query: q });
      setResults(resp.data?.results || []);
      setShowDropdown(true);
    } catch (e) {
      setResults([]);
    }
    setLoading(false);
  };

  const handleChange = (val) => {
    setQuery(val);
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 350);
  };

  const selectCity = (city) => {
    setQuery(city.name);
    onChange(city.name);
    setShowDropdown(false);
    setHighlighted(-1);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted(h => Math.min(h + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted(h => Math.max(h - 1, -1));
    } else if (e.key === 'Enter' && highlighted >= 0) {
      e.preventDefault();
      selectCity(results[highlighted]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  if (readOnly) {
    return (
      <input
        className={inputClassName}
        value={query}
        readOnly
        placeholder={placeholder}
      />
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-current opacity-30 pointer-events-none" />
        <input
          className={inputClassName + ' pl-9'}
          value={query}
          onChange={e => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results.length) setShowDropdown(true); }}
          placeholder={placeholder}
          autoComplete="off"
        />
        {loading && (
          <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B3FBF] animate-spin" />
        )}
      </div>
      {showDropdown && results.length > 0 && (
        <div className={`absolute z-50 w-full mt-1 bg-[#0D1B3E] border border-[rgba(123,63,191,0.3)] rounded-lg shadow-xl max-h-60 overflow-y-auto ${dropdownClassName}`}>
          {results.map((city, i) => (
            <button
              key={i}
              type="button"
              onClick={() => selectCity(city)}
              onMouseEnter={() => setHighlighted(i)}
              className={`w-full text-left px-3 py-2.5 text-sm transition-colors border-b border-[rgba(255,255,255,0.04)] last:border-0 ${
                i === highlighted ? 'bg-[rgba(123,63,191,0.15)]' : 'hover:bg-[rgba(123,63,191,0.08)]'
              }`}
            >
              <div className="text-[#F8FAFC] font-medium flex items-center gap-1.5">
                {city.source === 'cache' && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#C9A84C] flex-shrink-0" title="из кэша" />
                )}
                {city.name}
              </div>
              {city.region && (
                <div className="text-xs text-[#F8FAFC]/40">{city.region}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}