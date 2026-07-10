import { Hammer, Wallet, Home, ShieldCheck } from 'lucide-react';

const BENEFITS = [
  { icon: Hammer, title: 'Созидательный труд', desc: 'Восстанавливаем города, школы и больницы ЛНР и ДНР' },
  { icon: Wallet, title: 'Высокая зарплата', desc: 'От 300 000 ₽/мес, выплаты вовремя и прозрачно' },
  { icon: Home, title: 'Вахта 3 месяца', desc: 'Питание и проживание за счёт компании' },
  { icon: ShieldCheck, title: 'Надёжный работодатель', desc: 'Официальный договор по ТК РФ, соцпакет' },
];

export default function MissionBlock() {
  return (
    <div className="bg-gradient-to-br from-[#7B3FBF]/8 to-[#C9A84C]/5 border border-[rgba(123,63,191,0.2)] rounded-lg p-5 mb-4">
      <div className="text-center mb-4">
        <p className="text-xs text-[#C9A84C] font-bold tracking-widest uppercase mb-2">Программа восстановления ЛНР и ДНР</p>
        <h2 className="text-base font-bold text-[#F8FAFC] leading-snug">
          Добро пожаловать в команду БРО-СНБ!
        </h2>
        <p className="text-xs text-[#F8FAFC]/50 mt-1.5 leading-relaxed">
          Вы делаете первый шаг к работе, которой можно гордиться. Ваш труд — это вклад в возрождение городов и жизней.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {BENEFITS.map(b => {
          const Icon = b.icon;
          return (
            <div key={b.title} className="flex items-start gap-2 p-2.5 rounded-lg bg-[rgba(255,255,255,0.03)]">
              <Icon size={15} className="text-[#C9A84C] flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-[#F8FAFC]/80">{b.title}</div>
                <div className="text-[10px] text-[#F8FAFC]/40 leading-snug">{b.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}