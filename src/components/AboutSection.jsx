import SectionReveal from './SectionReveal';
import { Shield, Target, Users, Award } from 'lucide-react';

const values = [
  { icon: Shield, title: 'Надёжность', desc: 'Безупречная репутация среди государственных структур и органов власти.' },
  { icon: Target, title: 'Ответственность', desc: 'Каждый проект доводим до результата в установленные сроки.' },
  { icon: Users, title: 'Сплочённость', desc: 'Принцип «Своих не бросаем» — фундамент деятельности компании.' },
  { icon: Award, title: 'Профессионализм', desc: 'Уникальная методология подбора специалистов под конкретные задачи.' },
];

export default function AboutSection() {
  return (
    <section id="about" className="relative bg-[#05070A] py-32 overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none"
        style={{ background: 'radial-gradient(circle at top right, rgba(123,63,191,0.08) 0%, transparent 70%)' }}
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Section label */}
        <SectionReveal>
          <div className="flex items-center gap-4 mb-6">
            <span className="h-px flex-1 max-w-[60px] bg-[#7B3FBF]/50" />
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#7B3FBF]">О компании</span>
          </div>
        </SectionReveal>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left */}
          <div>
            <SectionReveal delay={0.1}>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-[-0.03em] text-[#F8FAFC] leading-[0.95] mb-8">
                Генеральный<br />
                подрядчик<br />
                <span className="text-[#7B3FBF]">государственного</span><br />
                рекрутинга
              </h2>
            </SectionReveal>

            <SectionReveal delay={0.2}>
              <p className="text-[#F8FAFC]/65 leading-relaxed mb-6">
                ООО «Братоуверие-СНБ» — специализированная компания, выступающая в роли
                генерального подрядчика по реализации проектов государственной важности. Мы
                являемся официальным партнёром администрации и Правительства Российской
                Федерации в сфере подбора высококвалифицированного персонала для стратегических
                проектов федерального масштаба.
              </p>
              <p className="text-[#F8FAFC]/65 leading-relaxed mb-10">
                Основная миссия компании — воплощение концепции братства и единства граждан
                России, реализация принципа <span className="text-[#C9A84C] font-semibold">«Своих не бросаем»</span>.
                Мы работаем в сложных ситуациях и решаем самые амбициозные задачи, поставленные государством.
              </p>
            </SectionReveal>

            <SectionReveal delay={0.3}>
              <div className="flex flex-col gap-3">
                {[
                  'Зарегистрировано: 20.04.2026',
                  'ОГРН: 1262500006966',
                  'ИНН: 2511135442',
                  'ОКВЭД 78.10 — деятельность агентств по подбору персонала',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <span className="w-1 h-1 rounded-full bg-[#C9A84C] flex-shrink-0" />
                    <span className="text-sm text-[#F8FAFC]/50 font-mono">{item}</span>
                  </div>
                ))}
              </div>
            </SectionReveal>
          </div>

          {/* Right — values */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <SectionReveal key={v.title} delay={0.15 + i * 0.1}>
                  <div className="glass-card rounded-lg p-6 h-full hover:border-[rgba(123,63,191,0.5)] transition-all duration-300 group">
                    <div className="w-10 h-10 rounded bg-[#7B3FBF]/15 flex items-center justify-center mb-4 group-hover:bg-[#7B3FBF]/25 transition-colors">
                      <Icon size={18} className="text-[#7B3FBF]" />
                    </div>
                    <h3 className="text-base font-bold text-[#F8FAFC] mb-2">{v.title}</h3>
                    <p className="text-sm text-[#F8FAFC]/55 leading-relaxed">{v.desc}</p>
                  </div>
                </SectionReveal>
              );
            })}
          </div>
        </div>

        {/* History timeline */}
        <div className="mt-24 vanguard-line pt-16">
          <SectionReveal>
            <h3 className="text-2xl font-bold text-[#F8FAFC] mb-12 tracking-tight">История развития</h3>
          </SectionReveal>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { year: '2022', title: 'Зарождение идеи', desc: 'Группа профессиональных HR-специалистов принимает решение создать специализированную организацию для государственного рекрутинга.' },
              { year: '2022–2023', title: 'Активный рост', desc: 'Период расширения географии деятельности. Начало активного сотрудничества с государственными структурами. Отработка методологии.' },
              { year: '2024', title: 'Признание', desc: 'Получение статуса официального партнёра администрации и Правительства РФ в сфере подбора высококвалифицированного персонала.' },
            ].map((t, i) => (
              <SectionReveal key={t.year} delay={i * 0.15}>
                <div className="relative pl-6 border-l border-[rgba(123,63,191,0.25)] hover:border-[rgba(123,63,191,0.6)] transition-colors duration-300">
                  <div className="absolute -left-[5px] top-0 w-[9px] h-[9px] rounded-full bg-[#7B3FBF]" />
                  <div className="text-[#C9A84C] text-sm font-bold tracking-wider mb-2">{t.year}</div>
                  <div className="text-base font-bold text-[#F8FAFC] mb-2">{t.title}</div>
                  <div className="text-sm text-[#F8FAFC]/55 leading-relaxed">{t.desc}</div>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}