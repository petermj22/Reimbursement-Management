// =============================================================
// GSAP ANIMATIONS HOOK - Reusable animation utilities
// =============================================================
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

// ---- Fade in from bottom with stagger ----
export function useGsapFadeInStagger(containerSelector?: string) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const targets = containerSelector
      ? el.querySelectorAll(containerSelector)
      : el.children;

    gsap.fromTo(
      targets,
      { opacity: 0, y: 30, scale: 0.95 },
      {
        opacity: 1, y: 0, scale: 1,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power3.out',
      }
    );
  }, [containerSelector]);

  return containerRef;
}

// ---- Number counter animation ----
export function useGsapCounter(targetValue: number, duration = 1.5) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const obj = { val: 0 };
    gsap.to(obj, {
      val: targetValue,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        if (ref.current) {
          ref.current.textContent = Math.round(obj.val).toLocaleString();
        }
      },
    });
  }, [targetValue, duration]);

  return ref;
}

// ---- Amount counter with dollar sign ----
export function useGsapAmountCounter(targetValue: number, prefix = '$', duration = 1.8) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const obj = { val: 0 };
    gsap.to(obj, {
      val: targetValue,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        if (ref.current) {
          ref.current.textContent = `${prefix}${Math.round(obj.val).toLocaleString()}`;
        }
      },
    });
  }, [targetValue, prefix, duration]);

  return ref;
}

// ---- Magnetic hover effect ----
export function useGsapMagnetic() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      gsap.to(el, { x: x * 0.15, y: y * 0.15, duration: 0.3, ease: 'power2.out' });
    };

    const handleLeave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
    };

    el.addEventListener('mousemove', handleMove);
    el.addEventListener('mouseleave', handleLeave);
    return () => {
      el.removeEventListener('mousemove', handleMove);
      el.removeEventListener('mouseleave', handleLeave);
    };
  }, []);

  return ref;
}

// ---- Parallax scroll effect ----
export function useGsapParallax(speed = 0.5) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleScroll = () => {
      const rect = el.getBoundingClientRect();
      const scrolled = rect.top * speed * -0.3;
      gsap.set(el, { y: scrolled });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return ref;
}

// ---- Pulse animation for status badges ----
export function useGsapPulse() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    gsap.to(ref.current, {
      scale: 1.05,
      duration: 0.8,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });
  }, []);

  return ref;
}
