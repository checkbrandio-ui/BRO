import { FileSignature, Package } from 'lucide-react';

const SIGN_DOCS = [
  'Трудовой договор',
  'Заявление о приёме на работу',
  'Расписка-обязательство',
  'Соглашение о безопасности и проф. этике',
  'Договор о мат. ответственности',
  'Лист инструктажа по ТБ',
  'Согласие на режимные ограничения',
  'Согласие на сопровождение',
  'Акт приёма-передачи документов',
];

export default function DocumentChecklist() {
  return (
    <div className="bg-[#C9A84C]/5 border border-[#C9A84C]/15 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <FileSignature size={16} className="text-[#C9A84C]" />
        <h3 className="text-sm font-bold text-[#C9A84C]">Чек-лист подписания</h3>
      </div>
      <p className="text-xs text-[#888]">Подпишите каждый документ и поставьте дату. Принесите все подписанные документы на пункт сбора.</p>
      <div className="space-y-1.5">
        {SIGN_DOCS.map((doc, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border border-[#C9A84C]/30 flex-shrink-0" />
            <span className="text-xs text-[#aaa]">{doc}</span>
          </div>
        ))}
      </div>
      <div className="flex items-start gap-2 pt-2 border-t border-[#C9A84C]/10">
        <Package size={14} className="text-[#C9A84C]/60 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-[#666]">Принесите все подписанные документы на пункт сбора в день отправки.</p>
      </div>
    </div>
  );
}