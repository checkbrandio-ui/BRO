import { useState } from 'react';
import SectionReveal from './SectionReveal';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const photos = [
  {
    src: 'https://media.base44.com/images/public/6a118622c856f058618fff8e/12000e12a_Two_professional_businessmen_standing_side_by_side-1780031760697.png',
    caption: 'Руководство компании',
    span: 'col-span-2',
  },
  {
    src: 'https://media.base44.com/images/public/6a118622c856f058618fff8e/cf975bdbb_Professional_corporate_office_portrait_with_brande-1779981329050.png',
    caption: 'В офисе Братоуверие',
    span: 'col-span-1',
  },
  {
    src: 'https://media.base44.com/images/public/6a118622c856f058618fff8e/30fdb7d0c_Transform_this_young_man_into_wearing_an_elegant_n-1780031660249.png',
    caption: 'Генеральный директор',
    span: 'col-span-1',
  },
  {
    src: 'https://media.base44.com/images/public/6a118622c856f058618fff8e/d86e52ee4_Professional_corporate_office_photography_A_confi-1779981242763.png',
    caption: 'Рабочий день директора',
    span: 'col-span-2',
  },
  {
    src: 'https://media.base44.com/images/public/6a118622c856f058618fff8e/e993d73bf_Dynamic_corporate_office_photography_showing_a_bus-1779981296069.png',
    caption: 'Оперативное совещание',
    span: 'col-span-1',
  },
  {
    src: 'https://media.base44.com/images/public/6a118622c856f058618fff8e/2f8263fb3_Corporate_team_meeting_photography_in_modern_offic-1779981322057.png',
    caption: 'Переговоры с партнёрами',
    span: 'col-span-1',
  },
  {
    src: 'https://media.base44.com/images/public/6a118622c856f058618fff8e/fb8d38a9b_Professional_office_lifestyle_photography_Two_bus-1779981316337.png',
    caption: 'Общение в команде',
    span: 'col-span-1',
  },
  {
    src: 'https://media.base44.com/images/public/6a118622c856f058618fff8e/a8f0d69e0_Corporate_team_collaboration_photo_in_conference_r-1779981347099.png',
    caption: 'Стратегическое планирование',
    span: 'col-span-2',
  },
  {
    src: 'https://media.base44.com/images/public/6a118622c856f058618fff8e/9b6aeaca7_Casual_corporate_team_gathering_in_modern_office_l-1779981363086.png',
    caption: 'Командный дух',
    span: 'col-span-1',
  },
  {
    src: 'https://media.base44.com/images/public/6a118622c856f058618fff8e/add352a1f_Corporate_office_break_room_social_interaction_An-1780042272529.png',
    caption: 'Перерыв в команде',
    span: 'col-span-2',
  },
  {
    src: 'https://media.base44.com/images/public/6a118622c856f058618fff8e/f28e6ec17_Professional_corporate_office_collaboration_scene-1780042628739.png',
    caption: 'Работа над проектом',
    span: 'col-span-1',
  },
  {
    src: 'https://media.base44.com/images/public/6a118622c856f058618fff8e/eab989c87_Remove_the_yellow_sticky_note_from_the_upper_left_-1780045812987.png',
    caption: 'Мозговой штурм',
    span: 'col-span-2',
  },
];

export default function OfficeGallery() {
  const [lightbox, setLightbox] = useState(null); // index

  const prev = () => setLightbox((i) => (i - 1 + photos.length) % photos.length);
  const next = () => setLightbox((i) => (i + 1) % photos.length);

  return (
    <section id="gallery" className="relative py-32 bg-[#0D1B3E] overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(123,63,191,0.3)] to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(201,168,76,0.2)] to-transparent" />

      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <SectionReveal>
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-4 mb-6">
              <span className="h-px flex-1 max-w-[60px] bg-[#7B3FBF]/50" />
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#7B3FBF]">Жизнь компании</span>
              <span className="h-px flex-1 max-w-[60px] bg-[#7B3FBF]/50" />
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-[-0.03em] text-[#F8FAFC] mb-4">
              Рабочие будни<br />
              <span className="text-[#7B3FBF]">нашей команды</span>
            </h2>
            <p className="text-[#F8FAFC]/55 max-w-lg mx-auto">
              Каждый день — это новые решения, переговоры и результаты. Смотрите, как работает команда Братоуверие.
            </p>
          </div>
        </SectionReveal>

        {/* Masonry-style grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {photos.map((photo, i) => (
            <SectionReveal key={i} delay={i * 0.07}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className={`relative overflow-hidden rounded-xl cursor-pointer group ${photo.span}`}
                style={{ aspectRatio: photo.span === 'col-span-2' ? '16/9' : '4/5' }}
                onClick={() => setLightbox(i)}
              >
                <img
                  src={photo.src}
                  alt={photo.caption}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#05070A]/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-sm font-semibold text-[#F8FAFC]">{photo.caption}</p>
                </div>
              </motion.div>
            </SectionReveal>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
            onClick={() => setLightbox(null)}
          >
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <X size={20} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <ChevronRight size={22} />
            </button>

            <motion.div
              key={lightbox}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.25 }}
              className="max-w-4xl max-h-[85vh] mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={photos[lightbox].src}
                alt={photos[lightbox].caption}
                className="max-w-full max-h-[80vh] object-contain rounded-xl"
              />
              <p className="text-center text-sm text-[#F8FAFC]/60 mt-3">{photos[lightbox].caption}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}