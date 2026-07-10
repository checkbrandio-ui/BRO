/**
 * Переключатель вкладок модального окна кандидата: Карточка / Анкета.
 */
export default function CandidateModalTabs({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'card', label: 'Карточка' },
    { id: 'questionnaire', label: 'Анкета кандидата' },
  ];

  return (
    <div className="flex border-b border-[rgba(123,63,191,0.15)] bg-[#0D1B3E]">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 py-3 text-sm font-bold transition-all ${
            activeTab === tab.id
              ? 'text-[#7B3FBF] border-b-2 border-[#7B3FBF]'
              : 'text-[#F8FAFC]/40 hover:text-[#F8FAFC]/70'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}