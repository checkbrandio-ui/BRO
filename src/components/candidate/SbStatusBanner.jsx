import { Clock, CheckCircle, XCircle, ShieldCheck } from 'lucide-react';

/**
 * Индикатор статуса проверки СБ для кандидата.
 * Показывается в самом верху анкеты.
 */
export default function SbStatusBanner({ sbCheck, candidateName }) {
  let status = 'waiting';
  let icon = Clock;
  let color = '#C9A84C';
  let bgColor = 'rgba(201,168,76,0.08)';
  let borderColor = 'rgba(201,168,76,0.25)';
  let title = 'Анкета получена';
  let desc = 'Загрузите все обязательные документы для прохождения проверки службы безопасности.';

  if (sbCheck === 'Согласован') {
    status = 'approved';
    icon = CheckCircle;
    color = '#4ade80';
    bgColor = 'rgba(74,222,128,0.08)';
    borderColor = 'rgba(74,222,128,0.3)';
    title = 'Проверка пройдена!';
    desc = 'Поздравляем! Вы допущены к работе. Переходите к этапу логистики — выберите пункт сбора и дату прибытия.';
  } else if (sbCheck === 'Не согласован') {
    status = 'rejected';
    icon = XCircle;
    color = '#f87171';
    bgColor = 'rgba(248,113,113,0.08)';
    borderColor = 'rgba(248,113,113,0.3)';
    title = 'Проверка не пройдена';
    desc = 'К сожалению, проверка СБ выявила ограничения. Свяжитесь с вашим агентством для уточнения деталей.';
  } else if (sbCheck === 'На проверке') {
    status = 'checking';
    icon = ShieldCheck;
    title = 'Идёт проверка СБ';
    desc = 'Ваши данные проверяются службой безопасности. Ожидайте результат — мы сообщим, как только всё будет готово.';
  }

  const Icon = icon;

  return (
    <div
      className="rounded-lg p-4 mb-4 flex items-start gap-3"
      style={{ background: bgColor, border: `1px solid ${borderColor}` }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: `rgba(${status === 'approved' ? '74,222,128' : status === 'rejected' ? '248,113,113' : '201,168,76'},0.15)` }}
      >
        <Icon size={20} style={{ color }} className={status === 'checking' || status === 'waiting' ? 'animate-pulse' : ''} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold" style={{ color }}>{title}</p>
        <p className="text-xs text-[#F8FAFC]/50 mt-0.5 leading-relaxed">{desc}</p>
        {candidateName && (
          <p className="text-[10px] text-[#F8FAFC]/30 mt-1">Кандидат: {candidateName}</p>
        )}
      </div>
    </div>
  );
}