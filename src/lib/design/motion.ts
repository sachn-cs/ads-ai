export const easeOutQuint = 'cubic-bezier(0.22, 1, 0.36, 1)';
export const easeInOutCubic = 'cubic-bezier(0.65, 0, 0.35, 1)';
export const easeOutBack = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

export const duration = {
  fast: 120,
  base: 200,
  slow: 320,
  page: 420,
} as const;

export const transitionBase = `${duration.base}ms ${easeOutQuint}`;
export const transitionFast = `${duration.fast}ms ${easeOutQuint}`;
export const transitionSlow = `${duration.slow}ms ${easeOutQuint}`;
export const transitionPage = `${duration.page}ms ${easeInOutCubic}`;

export const keyframes = {
  goldShimmer: {
    '0%': { backgroundPosition: '-200% 0' },
    '100%': { backgroundPosition: '200% 0' },
  },
  fadeUp: {
    '0%': { opacity: '0', transform: 'translateY(6px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' },
  },
  fadeIn: {
    '0%': { opacity: '0' },
    '100%': { opacity: '1' },
  },
  drawerSlideRight: {
    '0%': { transform: 'translateX(100%)' },
    '100%': { transform: 'translateX(0)' },
  },
  pulseRing: {
    '0%': { boxShadow: '0 0 0 0 rgba(212,175,55,0.35)' },
    '70%': { boxShadow: '0 0 0 8px rgba(212,175,55,0)' },
    '100%': { boxShadow: '0 0 0 0 rgba(212,175,55,0)' },
  },
} as const;
