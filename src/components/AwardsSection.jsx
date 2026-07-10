import { useState } from 'react';
import SectionReveal from './SectionReveal';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Award } from 'lucide-react';

const awards = [
  {
    title: 'Благодарность Правительства РФ',
    issuer: 'Правительство Российской Федерации',
    type: 'Благодарность',
    year: '2024',
    desc: 'ООО «БРО-СНБ» получила официальное признание от Правительства РФ за значительный вклад в реализацию национального проекта «Кадры». Компания продемонстрировала высокий профессионализм при организации массового подбора специалистов и подготовке кадров для ключевых отраслей экономики страны. Под личной координацией генерального директора И.А. Михляева компания внедрила инновационные методы рекрутинга, достигнув выдающихся результатов.',
    image: 'https://media.base44.com/images/public/6a118622c856f058618fff8e/994da1168_--.jpg',
    accentColor: '#C9A84C',
    portrait: true,
  },
  {
    title: 'Благодарность Министра здравоохранения РФ',
    issuer: 'Министерство здравоохранения РФ',
    type: 'Благодарность',
    year: '2024',
    desc: 'Министерство здравоохранения РФ выражает благодарность коллективу ООО «БРО-СНБ» за неоценимую помощь в комплектовании трудовых ресурсов для масштабной программы модернизации здравоохранения. Компания обеспечила высокий уровень кадрового сопровождения ремонтных работ на 10 000 объектах, продемонстрировав надёжность и профессиональный подход к решению стратегических задач отрасли.',
    image: 'https://media.base44.com/images/public/6a118622c856f058618fff8e/11d8178ed_.jpg',
    accentColor: '#C9A84C',
    portrait: true,
  },
  {
    title: 'Почётная грамота Минцифры России',
    issuer: 'Министерство цифрового развития, связи и массовых коммуникаций',
    type: 'Почётная грамота',
    year: '2025',
    desc: 'Министерство цифрового развития, связи и массовых коммуникаций отметило успешную работу ООО «БРО-СНБ» в области информационной безопасности. За успешное содействие в комплектовании специалистов по информационной безопасности компания внесла весомый вклад в решение стратегической задачи кадрового обеспечения государственного сектора, продемонстрировав высокий уровень профессионализма и ответственности.',
    image: 'https://media.base44.com/images/public/6a118622c856f058618fff8e/1148d61b5_Official_Russian_Certificate_of_Honor_Pochetnaya_-1779974154437.jpg',
    accentColor: '#7B3FBF',
    portrait: false,
  },
  {
    title: 'Почётная грамота Министерства просвещения РФ',
    issuer: 'Министерство просвещения Российской Федерации',
    type: 'Почётная грамота',
    year: '2024',
    desc: 'Коллектив ООО «БРО-СНБ» награждён почётной грамотой Министерства просвещения за весомый вклад в реализацию национального проекта по развитию сети образовательных учреждений. Компания обеспечила успешное комплектование кадрами строительства 1400 новых школ, 1700 детских садов и создание 246 000 мест в ясельных группах, продемонстрировав высокий уровень организационной и кадровой поддержки.',
    image: 'https://media.base44.com/images/public/6a118622c856f058618fff8e/9cb9620f5_Official_Russian_Certificate_of_Honor_Pochetnaya_-1779972088305.jpg',
    accentColor: '#7B3FBF',
    portrait: false,
  },
];

function CertificateFrame({ image, title, portrait }) {
  return (
    <div className="relative w-full" style={{ paddingBottom: portrait ? '135%' : '72%' }}>
      <div className="absolute inset-0 rounded-sm"
        style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.5)' }}
      >
        <div className="absolute inset-0 rounded-sm"
          style={{
            background: 'linear-gradient(135deg, #2a1f0e 0%, #4a3520 25%, #1a1208 50%, #3d2c18 75%, #2a1f0e 100%)',
            padding: '10px',
          }}
        >
          <div className="absolute inset-[10px] rounded-sm border border-[#C9A84C]/60 pointer-events-none z-10" />
          <div className="absolute inset-[10px] rounded-sm pointer-events-none z-20 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1/3"
              style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%)' }}
            />
          </div>
          <img
            src={image}
            alt={title}
            className="absolute inset-[10px] w-[calc(100%-20px)] h-[calc(100%-20px)] object-contain rounded-sm bg-white"
          />
        </div>
      </div>
    </div>
  );
}

export default function AwardsSection() {
  const [selected, setSelected] = useState(null);

  return (
    <section id="awards" className="relative py-32 bg-[#05070A] overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top center, rgba(201,168,76,0.05) 0%, transparent 60%)' }}
      />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(201,168,76,0.25)] to-transparent" />

      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <SectionReveal>
          <div className="text-center mb-20">
            <div className="flex items-center justify-center gap-4 mb-6">
              <span className="h-px flex-1 max-w-[60px] bg-[#C9A84C]/40" />
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#C9A84C]">Признание</span>
              <span className="h-px flex-1 max-w-[60px] bg-[#C9A84C]/40" />
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-[-0.03em] text-[#F8FAFC] mb-4">
              Грамоты и<br />
              <span className="text-[#C9A84C]">благодарности</span>
            </h2>
            <p className="text-[#F8FAFC]/55 max-w-xl mx-auto">
              Официальное признание от федеральных министерств и ведомств за вклад в реализацию государственных проектов.
            </p>
          </div>
        </SectionReveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {awards.map((award, i) => (
            <SectionReveal key={award.title} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col cursor-pointer group"
                onClick={() => setSelected(award)}
              >
                {/* Certificate in frame */}
                <CertificateFrame image={award.image} title={award.title} portrait={award.portrait} />

                {/* Info below */}
                <div className="mt-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Award size={12} style={{ color: award.accentColor }} />
                    <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: award.accentColor }}>
                      {award.type} · {award.year}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#F8FAFC] leading-snug mb-1 group-hover:text-[#C9A84C] transition-colors">
                    {award.title}
                  </h3>
                  <p className="text-xs text-[#F8FAFC]/40 leading-relaxed line-clamp-2">
                    {award.desc}
                  </p>
                </div>
              </motion.div>
            </SectionReveal>
          ))}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              className={`relative w-full bg-[#0D1B3E] rounded-2xl p-8 border border-[rgba(201,168,76,0.2)] grid gap-8 ${selected?.portrait ? 'max-w-lg' : 'max-w-3xl md:grid-cols-2'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelected(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#F8FAFC]/60 hover:text-[#F8FAFC] transition-colors"
              >
                <X size={16} />
              </button>

              <div>
                <CertificateFrame image={selected.image} title={selected.title} portrait={selected.portrait} />
              </div>

              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-3">
                  <Award size={14} style={{ color: selected.accentColor }} />
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: selected.accentColor }}>
                    {selected.type} · {selected.year}
                  </span>
                </div>
                <h3 className="text-xl font-black text-[#F8FAFC] mb-2 leading-tight">{selected.title}</h3>
                <p className="text-xs text-[#C9A84C]/70 mb-4">{selected.issuer}</p>
                <p className="text-sm text-[#F8FAFC]/65 leading-relaxed">{selected.desc}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}