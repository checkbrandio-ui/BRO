import CandidateModalNav from './CandidateModalNav';
import CandidateModalTabs from './CandidateModalTabs';

/**
 * Заголовок модального окна кандидата.
 * Делегирует рендеринг навигации/кнопок и вкладок соответствующим подкомпонентам.
 */
export default function CandidateModalHeader({
  candidate, canNavigate, hasPrev, hasNext, currentIndex, candidateListLength,
  stopList, saving, refreshing,
  onNavigate, onSaveClick, onRefresh, onQuickCall, onClose,
  activeTab, onTabChange,
}) {
  return (
    <>
      <CandidateModalNav
        candidate={candidate}
        canNavigate={canNavigate}
        hasPrev={hasPrev}
        hasNext={hasNext}
        currentIndex={currentIndex}
        candidateListLength={candidateListLength}
        stopList={stopList}
        saving={saving}
        refreshing={refreshing}
        onNavigate={onNavigate}
        onSaveClick={onSaveClick}
        onRefresh={onRefresh}
        onQuickCall={onQuickCall}
        onClose={onClose}
      />
      {candidate?.id && (
        <CandidateModalTabs activeTab={activeTab} onTabChange={onTabChange} />
      )}
    </>
  );
}