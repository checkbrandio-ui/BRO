import { X, Loader2, ChevronLeft, ChevronRight, RefreshCw, Phone, Save } from 'lucide-react';

export default function CandidateModalHeader({
  candidate, canNavigate, hasPrev, hasNext, currentIndex, candidateListLength,
  stopList, saving, refreshing,
  onNavigate, onSaveClick, onRefresh, onQuickCall, onClose,
  activeTab, onTabChange
}) {
  return (
    <>
      <div className="flex items-center justify-between p-5 border-b border-[rgba(123,63,191,0.15)] sticky top-0 bg-[#0D1B3E] z-10">
        <div className="flex items-center gap-2">
          {canNavigate && (
            <>
              <button onClick={() => onNavigate('prev')} disabled={!hasPrev}
                className="p-1.5 rounded-lg hover:bg-[#7B3FBF]/20 text-[#F8FAFC]/50 hover:text-[#7B3FBF] transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                title="Предыдущий кандидат">
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-[#F8FAFC]/40">{currentIndex + 1} / {candidateListLength}</span>
              <button onClick={() => onNavigate('next')} disabled={!hasNext}
                className="p-1.5 rounded-lg hover:bg-[#7B3FBF]/20 text-[#F8FAFC]/50 hover:text-[#7B3FBF] transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                title="Следующий кандидат">
                <ChevronRight size={16} />
              </button>
            </>
          )}
          <h2 className="text-lg font-black text-[#F8FAFC]">{candidate ? 'Редактировать кандидата' : 'Новый кандидат'}</h2>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onSaveClick} disabled={!!stopList || saving}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-[#7B3FBF] text-white hover:bg-[#8B4FCF] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span className="hidden sm:inline">{candidate ? 'Сохранить' : 'Создать'}</span>
          </button>
          {candidate?.id && (
            <button onClick={onRefresh} title="Обновить данные" disabled={refreshing}
              className="p-2 rounded-lg hover:bg-[#7B3FBF]/20 text-[#F8FAFC]/50 hover:text-[#7B3FBF] transition-all disabled:opacity-50">
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </button>
          )}
          {candidate?.phone && (
            <button onClick={onQuickCall} title={`Быстрый звонок: ${candidate.phone}`}
              className="p-2 rounded-lg hover:bg-green-500/20 text-[#F8FAFC]/50 hover:text-green-400 transition-all">
              <Phone size={16} />
            </button>
          )}
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-all text-[#F8FAFC]/60"><X size={18} /></button>
        </div>
      </div>

      {candidate?.id && (
        <div className="flex border-b border-[rgba(123,63,191,0.15)] bg-[#0D1B3E]">
          <button onClick={() => onTabChange('card')}
            className={`flex-1 py-3 text-sm font-bold transition-all ${activeTab === 'card' ? 'text-[#7B3FBF] border-b-2 border-[#7B3FBF]' : 'text-[#F8FAFC]/40 hover:text-[#F8FAFC]/70'}`}>
            Карточка
          </button>
          <button onClick={() => onTabChange('questionnaire')}
            className={`flex-1 py-3 text-sm font-bold transition-all ${activeTab === 'questionnaire' ? 'text-[#7B3FBF] border-b-2 border-[#7B3FBF]' : 'text-[#F8FAFC]/40 hover:text-[#F8FAFC]/70'}`}>
            Анкета кандидата
          </button>
        </div>
      )}
    </>
  );
}