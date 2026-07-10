import { useState, useEffect, useRef, useCallback } from 'react';

const STORAGE_KEY = 'crm-badge-pos';
const DRAG_THRESHOLD = 5; // px — меньше этого = клик, больше = перетаскивание

/**
 * Простой хук перетаскивания для плавающих элементов.
 * Сохраняет позицию в localStorage и отличает клик от перетаскивания.
 *
 * @param {string} storageKey — ключ localStorage (по умолчанию crm-badge-pos)
 * @returns { ref, position, isDragging, handlers }
 *   handlers — вешаются на drag-handle элемент
 */
export function useDraggable(storageKey = STORAGE_KEY) {
  const [position, setPosition] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const { x, y } = JSON.parse(saved);
        if (typeof x === 'number' && typeof y === 'number') return { x, y };
      }
    } catch {}
    return { x: -1, y: -1 }; // -1 = позиция по умолчанию (top-right)
  });

  const [isDragging, setIsDragging] = useState(false);
  const startRef = useRef({ mouseX: 0, mouseY: 0, posX: 0, posY: 0, moved: false });
  const draggingRef = useRef(false);
  const elementRef = useRef(null);

  // Сохраняем позицию в localStorage
  const persist = useCallback((x, y) => {
    try { localStorage.setItem(storageKey, JSON.stringify({ x, y })); } catch {}
  }, [storageKey]);

  // Ограничение в пределах viewport
  const clamp = useCallback((x, y, el) => {
    const w = el?.offsetWidth || 200;
    const h = el?.offsetHeight || 50;
    const maxX = window.innerWidth - w - 8;
    const maxY = window.innerHeight - h - 8;
    return {
      x: Math.max(8, Math.min(x, maxX)),
      y: Math.max(8, Math.min(y, maxY)),
    };
  }, []);

  const onPointerDown = useCallback((e) => {
    // Игнорируем клики по интерактивным элементам внутри (кнопка меню)
    if (e.target.closest('button[data-menu-toggle]') || e.button !== 0) return;
    const el = elementRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    // Если позиция ещё не задана (по умолчанию top-right), вычисляем текущую
    const currentX = position.x >= 0 ? position.x : (window.innerWidth - rect.width - 16);
    const currentY = position.y >= 0 ? position.y : 16;
    startRef.current = { mouseX: startX, mouseY: startY, posX: currentX, posY: currentY, moved: false };
    draggingRef.current = true;
    el.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  }, [position]);

  const onPointerMove = useCallback((e) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - startRef.current.mouseX;
    const dy = e.clientY - startRef.current.mouseY;
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
      startRef.current.moved = true;
      setIsDragging(true);
    }
    if (startRef.current.moved) {
      const newX = startRef.current.posX + dx;
      const newY = startRef.current.posY + dy;
      const clamped = clamp(newX, newY, elementRef.current);
      setPosition(clamped);
    }
  }, [clamp]);

  const onPointerUp = useCallback((e) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setIsDragging(false);
    const wasDragged = startRef.current.moved;
    // Сохраняем только если реально перетаскивали
    if (wasDragged && position.x >= 0) {
      persist(position.x, position.y);
    }
    return wasDragged; // true если был drag, false если был клик
  }, [position, persist]);

  // Обработчик как ref callback для drag handle
  const handleRef = useCallback((node) => {
    if (node) {
      node.addEventListener('pointerdown', onPointerDown);
    }
  }, [onPointerDown]);

  return {
    elementRef,
    position,
    isDragging,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    isDefault: position.x < 0,
  };
}