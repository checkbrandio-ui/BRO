import { useMemo } from 'react';

const SCENES = [
  {
    url: 'https://media.base44.com/images/public/6a118622c856f058618fff8e/cfec341e2_generated_image.png',
    caption: 'Рассвет созидания',
  },
  {
    url: 'https://media.base44.com/images/public/6a118622c856f058618fff8e/8c34f4c2d_generated_image.png',
    caption: 'Восстановленный мир',
  },
  {
    url: 'https://media.base44.com/images/public/6a118622c856f058618fff8e/932175fd5_generated_image.png',
    caption: 'Видение мастера',
  },
];

/**
 * Полупрозрачный фон-«дымка» для страницы онбординга.
 * Случайным образом выбирает один из трёх сюжетов (A/B-стиль)
 * и закрепляет выбор в sessionStorage, чтобы при перезагрузке
 * картинка не «прыгала».
 */
export default function OnboardingBackground() {
  const scene = useMemo(() => {
    const KEY = 'onboarding_bg_scene';
    let idx = sessionStorage.getItem(KEY);
    if (idx === null || isNaN(parseInt(idx, 10)) || parseInt(idx, 10) >= SCENES.length) {
      idx = String(Math.floor(Math.random() * SCENES.length));
      try { sessionStorage.setItem(KEY, idx); } catch (_) {}
    }
    return SCENES[parseInt(idx, 10)];
  }, []);

  return (
    <div
      className="fixed inset-0 z-[-1] pointer-events-none"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(5,7,10,0.82), rgba(13,27,62,0.78), rgba(5,7,10,0.88)), url(${scene.url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        filter: 'blur(3px) grayscale(15%)',
        opacity: 0.55,
      }}
      aria-hidden="true"
    />
  );
}