import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/api/base44Client';
import { AlertTriangle, Loader2 } from 'lucide-react';
import CandidateFormView from './CandidateFormView';
import { getMissingRequiredDocs } from '@/lib/docUtils';
import { findNearestAssemblyPoint } from '@/lib/geoUtils';
import { getCrmAdmin, getCurrentActor } from '@/lib/crmSession';
import { notifyLogisticsChange } from '@/lib/notifyLogisticsChange';
import { notifyFinalCallConfirmed } from '@/lib/notifyFinalCallConfirmed';
import { logCandidateAction } from '@/lib/candidateLogger';
import LogisticsBlock from './LogisticsBlock';
import CallDrawer from './CallDrawer';
import SbReportButton from '@/components/admin/SbReportButton';
import CandidateModalHeader from './CandidateModalHeader';
import PersonalDataSection from './PersonalDataSection';
import ContactsSection from './ContactsSection';
import AdminStatusesSection from './AdminStatusesSection';
import CommentSection from './CommentSection';
import CandidateDocuments from './CandidateDocuments';
import GeneratedDocumentsSection from './GeneratedDocumentsSection';



export default function CandidateModal({ candidate, agencies, lockedAgencyId, candidateList, onSave, onClose, onNavigate }) {
  const isAgencyMode = !!lockedAgencyId;

  const buildForm = (c) => ({
    full_name: c?.full_name || '',
    position: c?.position || '',
    agency_id: c?.agency_id || lockedAgencyId || '',
    agency_name: c?.agency_name || (agencies?.find(a => a.id === lockedAgencyId)?.name || ''),
    birth_date: c?.birth_date ?? '',
    citizenship: c?.citizenship ?? '',
    birth_place: c?.birth_place ?? '',
    health_status: c?.health_status ?? '',
    health_details: c?.health_details ?? '',
    city: c?.city ?? '',
    assembly_point: c?.assembly_point ?? '',
    arrival_date: c?.arrival_date ?? '',
    sb_check: c?.sb_check ?? '',
    medical_check: c?.medical_check ?? '',
    comment: c?.comment ?? '',
    phone: c?.phone ?? '',
    email: c?.email ?? '',
    payment_basis: c?.payment_basis ?? '',
    payment_made: c?.payment_made ?? '',
    arrival_time: c?.arrival_time ?? '',
    ticket_photo_url: c?.ticket_photo_url ?? '',
    logistics_status: c?.logistics_status ?? 'none',
    logistics_confirmed_at: c?.logistics_confirmed_at ?? '',
    proposed_assembly_point: c?.proposed_assembly_point ?? '',
    proposed_arrival_date: c?.proposed_arrival_date ?? '',
    proposed_arrival_time: c?.proposed_arrival_time ?? '',
    proposed_by: c?.proposed_by ?? '',
    final_call_confirmed: c?.final_call_confirmed ?? false,
    final_call_confirmed_at: c?.final_call_confirmed_at ?? '',
  });

  const [form, setForm] = useState(buildForm(candidate));
  const nameInputRef = useRef(null);
  const savingRef = useRef(false);

  useEffect(() => {
    if (!candidate?.id && nameInputRef.current) {
      const timer = setTimeout(() => nameInputRef.current?.focus(), 200);
      return () => clearTimeout(timer);
    }
  }, [candidate?.id]);

  const [stopList, setStopList] = useState(null);
  const [checking, setChecking] = useState(false);
  const [formDocs, setFormDocs] = useState([]);
  const [candidateFormId, setCandidateFormId] = useState(null);
  const [candidateFormData, setCandidateFormData] = useState(null);
  const [activeTab, setActiveTab] = useState('card');
  const [cityObject, setCityObject] = useState(null);
  const [assemblyPoints, setAssemblyPoints] = useState([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [cityCache, setCityCache] = useState({});
  const [user, setUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [callDrawerOpen, setCallDrawerOpen] = useState(false);

  useEffect(() => {
    setForm(buildForm(candidate));
    setErrors({});
    setStopList(null);
  }, [candidate?.id]);

  // Загружаем города и сборные пункты через REST
  useEffect(() => {
    setUser(getCrmAdmin());

    // Сборные пункты
    apiClient.get(`/api/cities?is_assembly_point=true&limit=200`)
      
      .then(data => { if (data) setAssemblyPoints(data); })
      .catch(() => {});

    // Все города для геокэша
    apiClient.get(`/api/cities?limit=500`)
      
      .then(data => {
        if (!data) return;
        const map = {};
        data.forEach(c => { if (c.name && c.lat != null && c.lon != null) map[c.name.toLowerCase()] = c; });
        setCityCache(map);
      })
      .catch(() => {});
  }, []);

  // Загружаем форму кандидата через REST
  useEffect(() => {
    if (!candidate?.id) return;
    apiClient.get(`/api/candidate-forms?candidate_id=${candidate.id}`)
      
      .then(async records => {
        const records_list = records || [];
        if (records_list.length > 0) {
          const rec = records_list.find(r => r.status === 'completed') || records_list[0];
          setCandidateFormId(rec.id);
          setFormDocs(rec.uploaded_docs || []);
          setCandidateFormData(rec);
        } else {
          // Создаём форму
          const token = 'cf-' + Math.random().toString(36).substring(2, 10) + '-' + Math.random().toString(36).substring(2, 10);
          const newForm = await apiClient.post(`/api/candidate-forms`, { candidate_id: candidate.id, form_token: token, status: 'pending' });
          if (newForm?.id) {
            setCandidateFormId(newForm.id);
            // Обновляем токен кандидата
            await apiClient.patch(`/api/candidates/${candidate.id}`, { form_token: token, form_status: 'pending' });
          }
        }
      })
      .catch(() => {});
  }, [candidate?.id]);

  const currentIndex = candidateList && candidate?.id
    ? candidateList.findIndex(c => c.id === candidate.id)
    : -1;
  const canNavigate = candidateList && currentIndex >= 0;
  const hasPrev = canNavigate && currentIndex > 0;
  const hasNext = canNavigate && currentIndex < candidateList.length - 1;

  const isFormDirty = () => {
    if (!candidate) return false;
    const initial = buildForm(candidate);
    return Object.keys(initial).some(k => String(initial[k] ?? '') !== String(form[k] ?? ''));
  };

  const refreshCandidate = async () => {
    if (!candidate?.id) return;
    setRefreshing(true);
    try {
      const data = await apiClient.get(`/api/candidates/${candidate.id}`);
      if (data) setForm(buildForm(data));
    } catch (e) {}
    setRefreshing(false);
  };

  const handleClose = async () => {
    if (isFormDirty() && candidate?.id) {
      try {
        if (candidateFormId) {
          await apiClient.patch(`/api/candidate-forms/${candidateFormId}`, { uploaded_docs: formDocs });
        }
        const { documents, ...candidateData } = form;
        await onSave(candidateData, candidate?.id);
        return;
      } catch (e) {}
    }
    onClose();
  };

  const handleSaveCallNotes = async ({ notes, audioUrl, transcript }) => {
    if (!candidate?.id) return;
    const role = user?.role === 'super_admin' ? 'Супер-админ' : user?.role === 'manager' ? 'Менеджер' : 'Администратор';
    const timestamp = new Date().toLocaleString('ru-RU');
    let callLog = '\n---\n[📞 Звонок | ' + role + ' | ' + timestamp + ']';
    if (notes) callLog += '\nЗаметки: ' + notes;
    if (transcript) callLog += '\nТранскрипция: ' + transcript;
    if (audioUrl) callLog += '\nЗапись: ' + audioUrl;
    const newComment = (form.comment || '') + callLog;
    set('comment', newComment);
    try {
      await apiClient.patch(`/api/candidates/${candidate.id}`, { comment: newComment });
      await logCandidateAction({ action: 'update', candidate: { ...candidate, ...form, comment: newComment, id: candidate.id }, oldData: { ...candidate, ...form }, actor: getCurrentActor() });
    } catch (e) {}
  };

  const handleQuickCall = async () => {
    if (!candidate?.phone) return;
    window.location.href = `tel:${candidate.phone}`;
    const role = user?.role === 'super_admin' ? 'Супер-админ' : user?.role === 'manager' ? 'Менеджер' : 'Администратор';
    const timestamp = new Date().toLocaleString('ru-RU');
    const callLog = '\n---\n[📞 Быстрый звонок | ' + role + ' | ' + timestamp + ']';
    const newComment = (form.comment || '') + callLog;
    set('comment', newComment);
    try {
      await apiClient.patch(`/api/candidates/${candidate.id}`, { comment: newComment });
      await logCandidateAction({ action: 'update', candidate: { ...candidate, ...form, comment: newComment, id: candidate.id }, oldData: { ...candidate, ...form }, actor: getCurrentActor() });
    } catch (e) {}
  };

  const handleNavigate = async (dir) => {
    if (!canNavigate) return;
    if (isFormDirty() && candidate?.id) {
      try {
        if (candidateFormId) {
          await apiClient.patch(`/api/candidate-forms/${candidateFormId}`, { uploaded_docs: formDocs });
        }
        const { documents, ...candidateData } = form;
        await apiClient.patch(`/api/candidates/${candidate.id}`, candidateData);
        await logCandidateAction({ action: 'update', candidate: { ...candidateData, id: candidate.id }, oldData: candidate, actor: getCurrentActor() });
      } catch (e) {}
    }
    const newIdx = dir === 'prev' ? currentIndex - 1 : currentIndex + 1;
    const nextCand = candidateList[newIdx];
    if (nextCand && onNavigate) onNavigate(nextCand);
  };

  const instantLogisticsSave = async (updates) => {
    if (!candidate?.id) return;
    try {
      const oldData = { ...candidate };
      const newData = { ...candidate, ...updates };
      await apiClient.patch(`/api/candidates/${candidate.id}`, updates);
      const actor = getCurrentActor();
      const tasks = [
        notifyLogisticsChange(newData, oldData, actor),
        logCandidateAction({ action: 'update', candidate: newData, oldData, actor }),
      ];
      if (updates.final_call_confirmed === true) {
        tasks.push(notifyFinalCallConfirmed(newData, actor));
      }
      await Promise.all(tasks);
    } catch (e) {
      alert('Ошибка сохранения: ' + e.message);
    }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleAgencyChange = (agencyId) => {
    const agency = agencies.find(a => a.id === agencyId);
    set('agency_id', agencyId);
    set('agency_name', agency?.name || '');
  };

  // Проверка стоп-листа через REST с дебаунсом
  const stopCheckTimer = useRef(null);
  const checkStopList = (full_name, birth_date) => {
    clearTimeout(stopCheckTimer.current);
    if (!full_name || !birth_date) { setStopList(null); setChecking(false); return; }
    setChecking(true);
    stopCheckTimer.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ full_name, birth_date });
        const found_raw = await apiClient.get(`/api/candidates?${params}&limit=5`);
        const found = (found_raw || []).filter(c => c.id !== candidate?.id && !c.deleted_at);
        setStopList(found.length > 0 ? { full_name: found[0].full_name, agency_name: found[0].agency_name } : null);
      } catch {
        setStopList(null);
      } finally {
        setChecking(false);
      }
    }, 600);
  };

  const handleNameChange = (v) => {
    set('full_name', v);
    checkStopList(v, form.birth_date);
  };

  const handleBirthDateChange = (v) => {
    set('birth_date', v);
    checkStopList(form.full_name, v);
  };

  const handleAssemblyPointChange = async (assemblyPointName) => {
    set('assembly_point', assemblyPointName);
    if (!form.city || !assemblyPointName) return;

    const candidateCity = cityCache[form.city.toLowerCase()];
    const selectedPoint = Object.values(cityCache).find(c => c.name === assemblyPointName);

    if (!candidateCity?.lat || !candidateCity?.lon || !selectedPoint?.lat || !selectedPoint?.lon) return;

    const result = findNearestAssemblyPoint(candidateCity.lat, candidateCity.lon, [selectedPoint]);
    if (result) {
      const distance = result.distance;
      set('assembly_distance', String(distance));
      const role = user?.role === 'admin' ? 'Администратор' : 'Модератор';
      const timestamp = new Date().toLocaleString('ru-RU');
      const newCommentText = `[${role} | ${timestamp}] Выбрана точка сбора: ${assemblyPointName} (${distance} км)`;
      const oldComments = (form.comment || '').split('\n---\n');
      const baseComment = oldComments[0]?.trim() || '';
      const newComment = baseComment ? `${baseComment}\n---\n${newCommentText}` : newCommentText;
      set('comment', newComment);
    }
  };

  const handleSaveClick = async () => {
    if (stopList) return;
    if (savingRef.current) return;
    const newErrors = {};
    if (!form.full_name?.trim()) newErrors.full_name = true;
    if (!form.birth_date) newErrors.birth_date = true;
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    if (form.city && !cityObject) {
      alert('Пожалуйста, выберите населённый пункт из списка. Текстовый ввод не допускается — выберите ближайший из каталога.');
      return;
    }
    savingRef.current = true;
    setSaving(true);
    try {
      if (candidateFormId) {
        await apiClient.patch(`/api/candidate-forms/${candidateFormId}`, { uploaded_docs: formDocs });
      }
      const { documents, ...candidateData } = form;
      await onSave(candidateData, candidate?.id);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const inp = "w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(123,63,191,0.2)] rounded-lg px-3 py-2.5 text-sm text-[#F8FAFC] placeholder:text-[#F8FAFC]/25 focus:outline-none focus:border-[#7B3FBF] transition-all";
  const paymentAmount = form.payment_basis === 'Готовится к отправке' ? '100 000 ₽' : form.payment_basis === 'Отказался от отправки' ? 'Не предусмотрена' : '—';
  const missingDocs = getMissingRequiredDocs(formDocs, form.citizenship);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0D1B3E] border-l border-[rgba(123,63,191,0.25)] w-full max-w-2xl h-full overflow-y-auto shadow-2xl drawer-slide-in">
        <CandidateModalHeader
          candidate={candidate}
          canNavigate={canNavigate}
          hasPrev={hasPrev}
          hasNext={hasNext}
          currentIndex={currentIndex}
          candidateListLength={candidateList?.length}
          stopList={stopList}
          saving={saving}
          refreshing={refreshing}
          onNavigate={handleNavigate}
          onSaveClick={handleSaveClick}
          onRefresh={refreshCandidate}
          onQuickCall={handleQuickCall}
          onClose={handleClose}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <div className={`p-6 space-y-5 ${(activeTab === 'card' || !candidate?.id) && activeTab !== 'history' ? '' : 'hidden'}`}>
          {candidate?.id && missingDocs.length > 0 && (
            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-bold text-red-400">Неполный пакет документов</div>
                <div className="text-xs text-red-300/80 mt-1">
                  Не хватает: {missingDocs.map(d => d.label).join(', ')}
                </div>
              </div>
            </div>
          )}

          {stopList && (
            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-bold text-red-400">СТОП-ЛИСТ: Кандидат уже в базе</div>
                <div className="text-xs text-red-300/80 mt-1">
                  «{stopList.full_name}» с такой датой рождения уже зарегистрирован
                  {stopList.agency_name ? ` (агентство: ${stopList.agency_name})` : ''}.
                  Сохранение заблокировано.
                </div>
              </div>
            </div>
          )}

          <PersonalDataSection
            form={form}
            set={set}
            errors={errors}
            setErrors={setErrors}
            nameInputRef={nameInputRef}
            checking={checking}
            onNameChange={handleNameChange}
            onBirthDateChange={handleBirthDateChange}
            onCitySelect={setCityObject}
            inp={inp}
          />

          <ContactsSection
            form={form}
            set={set}
            isAgencyMode={isAgencyMode}
            agencies={agencies}
            onAgencyChange={handleAgencyChange}
            onOpenCallDrawer={() => setCallDrawerOpen(true)}
            inp={inp}
          />

          <LogisticsBlock
            form={form}
            set={set}
            candidate={candidate}
            instantLogisticsSave={instantLogisticsSave}
            handleAssemblyPointChange={handleAssemblyPointChange}
            assemblyPoints={assemblyPoints}
            inp={inp}
          />

          {!isAgencyMode && (
            <AdminStatusesSection
              form={form}
              set={set}
              paymentAmount={paymentAmount}
              inp={inp}
            />
          )}

          <CommentSection
            form={form}
            set={set}
            candidate={candidate}
            user={user}
            inp={inp}
          />

          <CandidateDocuments
            formDocs={formDocs}
            setFormDocs={setFormDocs}
            citizenship={form.citizenship}
          />

          {candidate?.id && (
            <GeneratedDocumentsSection candidateId={candidate.id} candidateName={form.full_name} />
          )}

          {candidate?.id && (
            <div className="flex justify-start pt-2 border-t border-[rgba(123,63,191,0.15)]">
              <SbReportButton candidate={{ ...candidate, ...form }} formDocs={formDocs} candidateFormData={candidateFormData} />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-6 py-2.5 text-sm rounded-lg border border-[rgba(255,255,255,0.1)] text-[#F8FAFC]/60 hover:text-[#F8FAFC] transition-all">Отмена</button>
            <button
              onClick={handleSaveClick}
              disabled={!!stopList || saving}
              className="flex items-center justify-center gap-2 px-6 py-2.5 text-sm rounded-lg bg-[#7B3FBF] text-white hover:bg-[#8B4FCF] font-bold disabled:opacity-40 disabled:cursor-not-allowed relative">
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Сохранение...</span>
                </>
              ) : (
                <span>{candidate ? 'Сохранить' : 'Создать'}</span>
              )}
            </button>
          </div>
        </div>

        {activeTab === 'questionnaire' && candidate?.id && (
          <div className="p-6">
            <CandidateFormView candidateId={candidate.id} candidate={candidate} />
          </div>
        )}
      </div>

      {callDrawerOpen && (
        <CallDrawer
          candidate={{ ...candidate, ...form }}
          onClose={() => setCallDrawerOpen(false)}
          onSaveNotes={handleSaveCallNotes}
        />
      )}
    </div>
  );
}

