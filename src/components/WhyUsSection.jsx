import SectionReveal from './SectionReveal';
import { motion } from 'framer-motion';
import { Zap, DollarSign, FileText, TrendingUp, Lock, Headphones } from 'lucide-react';

const advantages = [
  {
    icon: FileText,
    title: 'Прямой доступ к госзаказчикам',
    desc: 'Официальные договоры с органами государственного управления. Статус генерального подрядчика по проектам государственной важности.',
    accent: 'gold',
  },
  {
    icon: DollarSign,
    title: 'Гарантированная оплата',
    desc: 'Своевременная выплата вознаграждения партнёрам в установленные сроки. Чёткие фиксированные условия сотрудничества.',
    accent: 'gold',
  },
  {
    icon: TrendingUp,
    title: 'Долгосрочное партнёрство',
    desc: 'Контракты от 1 до 3 лет. Стабильный доход благодаря постоянному потоку государственных заказов и расширению географии.',
    accent: 'purple',
  },
  {
    icon: Zap,
    title: 'Постоянный поток вакансий',
    desc: 'Непрерывный входящий поток заявок из федеральных проектов. Приоритетное размещение вакансий для партнёров-агентств.',
    accent: 'purple',
  },
  {
    icon: Lock,
    title: 'Юридическая защищённость',
    desc: 'Прозрачная структура взаимодействия. Официально зарегистрированное ООО, действующее юридическое лицо ЕГРЮЛ.',
    accent: 'purple',
  },
  {
    icon: Headphones,
    title: 'Поддержка на каждом этапе',
    desc: 'Профессиональная консультация и оперативная обратная связь по всем вопросам. Обучение новым методикам подбора.',
    accent: 'gold',
  },
];

export default function WhyUsSection() {
  return (
    <section id="why-us" className="relative py-32 bg-[#0D1B3E] overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 80% 50%, rgba(123,63,191,0.07) 0%, transparent 60%)' }}
      />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(123,63,191,0.3)] to-transparent" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(201,168,76,0.2)] to-transparent" />

      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-20">
          <SectionReveal>
            <div className="flex items-center justify-center gap-4 mb-6">
              <span className="h-px flex-1 max-w-[60px] bg-[#7B3FBF]/50" />
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#7B3FBF]">Преимущества</span>
              <span className="h-px flex-1 max-w-[60px] bg-[#7B3FBF]/50" />
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-[-0.03em] text-[#F8FAFC] mb-4">
              Почему выбирают
              <span className="text-[#7B3FBF]"> нас</span>
            </h2>
            <p className="text-[#F8FAFC]/55 max-w-xl mx-auto">
              Уникальное положение на рынке рекрутинговых услуг делает нас предпочтительным партнёром
              для HR-агентств, работающих с государственными проектами.
            </p>
          </SectionReveal>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {advantages.map((a, i) => {
            const Icon = a.icon;
            const isGold = a.accent === 'gold';
            return (
              <SectionReveal key={a.title} delay={i * 0.08}>
                <motion.div
                  whileHover={{ y: -5, scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                  className={`relative rounded-xl p-7 h-full group overflow-hidden cursor-default ${
                    isGold ? 'glass-card-gold' : 'glass-card'
                  }`}
                >
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-xl`}
                    style={{ background: isGold
                      ? 'radial-gradient(circle at top left, rgba(201,168,76,0.08) 0%, transparent 70%)'
                      : 'radial-gradient(circle at top left, rgba(123,63,191,0.10) 0%, transparent 70%)'
                    }}
                  />
                  <div className="relative z-10">
                    <div className={`w-11 h-11 rounded-lg flex items-center justify-center mb-5 ${
                      isGold ? 'bg-[#C9A84C]/10' : 'bg-[#7B3FBF]/12'
                    }`}>
                      <Icon size={20} className={isGold ? 'text-[#C9A84C]' : 'text-[#7B3FBF]'} />
                    </div>
                    <h3 className="text-base font-bold text-[#F8FAFC] mb-3">{a.title}</h3>
                    <p className="text-sm text-[#F8FAFC]/55 leading-relaxed">{a.desc}</p>
                  </div>
                </motion.div>
              </SectionReveal>
            );
          })}
        </div>

        {/* Quality metrics */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { val: '95%', label: 'кандидатов успешно прошли отбор' },
            { val: '88%', label: 'специалистов остались после первого контракта' },
            { val: '92%', label: 'проектов завершены в срок' },
            { val: '100%', label: 'соответствие требованиям квалификации' },
          ].map((m, i) => (
            <SectionReveal key={m.label} delay={i * 0.1}>
              <div className="text-center p-5 rounded-xl border border-[rgba(201,168,76,0.15)] bg-[rgba(201,168,76,0.03)]">
                <div className="text-3xl font-black text-[#C9A84C] mb-2">{m.val}</div>
                <div className="text-xs text-[#F8FAFC]/45 leading-tight">{m.label}</div>
              </div>
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}