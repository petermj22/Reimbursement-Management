// =============================================================
// LOTTIE ANIMATIONS - Animated illustrations for key moments
// =============================================================
import React from 'react';
import Lottie from 'lottie-react';

// Inline Lottie JSON - Success checkmark (lightweight)
const successAnimationData = {
  v: "5.7.1",
  fr: 30,
  ip: 0,
  op: 40,
  w: 200,
  h: 200,
  assets: [],
  layers: [
    {
      ddd: 0, ind: 1, ty: 4, nm: "check", sr: 1, ks: {
        o: { a: 0, k: 100 }, r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 100, 0] }, s: { a: 0, k: [100, 100, 100] }
      },
      shapes: [
        {
          ty: "gr", it: [
            {
              ty: "sh", d: 1, ks: {
                a: 1, k: [
                  { t: 10, s: [{ i: [[0, 0]], o: [[0, 0]], v: [[60, 100]], c: false }] },
                  { t: 20, s: [{ i: [[0, 0], [0, 0]], o: [[0, 0], [0, 0]], v: [[60, 100], [90, 130]], c: false }] },
                  { t: 30, s: [{ i: [[0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0]], v: [[60, 100], [90, 130], [140, 70]], c: false }] }
                ]
              }
            },
            { ty: "st", c: { a: 0, k: [0.38, 0.82, 0.46, 1] }, o: { a: 0, k: 100 }, w: { a: 0, k: 8 }, lc: 2, lj: 2 },
            { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } }
          ]
        },
        {
          ty: "gr", it: [
            {
              ty: "el", d: 1, s: {
                a: 1, k: [
                  { t: 0, s: [0, 0] },
                  { t: 15, s: [140, 140] }
                ]
              }, p: { a: 0, k: [100, 100] }
            },
            { ty: "st", c: { a: 0, k: [0.38, 0.82, 0.46, 1] }, o: { a: 0, k: 100 }, w: { a: 0, k: 4 } },
            { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } }
          ]
        }
      ]
    }
  ]
};

// Empty state animation inline
const emptyAnimationData = {
  v: "5.7.1", fr: 30, ip: 0, op: 60, w: 200, h: 200, assets: [], layers: [
    {
      ddd: 0, ind: 1, ty: 4, nm: "box", sr: 1, ks: {
        o: { a: 0, k: 100 }, r: { a: 1, k: [{ t: 0, s: [0] }, { t: 30, s: [-5] }, { t: 60, s: [0] }] },
        p: { a: 1, k: [{ t: 0, s: [100, 100, 0] }, { t: 30, s: [100, 90, 0] }, { t: 60, s: [100, 100, 0] }] },
        s: { a: 0, k: [100, 100, 100] }
      },
      shapes: [
        {
          ty: "gr", it: [
            { ty: "rc", d: 1, s: { a: 0, k: [80, 60] }, p: { a: 0, k: [100, 100] }, r: { a: 0, k: 8 } },
            { ty: "st", c: { a: 0, k: [0.6, 0.6, 0.7, 1] }, o: { a: 0, k: 100 }, w: { a: 0, k: 3 } },
            { ty: "fl", c: { a: 0, k: [0.95, 0.95, 0.98, 1] }, o: { a: 0, k: 100 } },
            { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } }
          ]
        }
      ]
    }
  ]
};

// ---- Components ----
export const LottieSuccess: React.FC<{ size?: number; loop?: boolean }> = ({ size = 120, loop = false }) => (
  <Lottie animationData={successAnimationData} loop={loop} style={{ width: size, height: size }} />
);

export const LottieEmpty: React.FC<{ size?: number }> = ({ size = 150 }) => (
  <Lottie animationData={emptyAnimationData} loop style={{ width: size, height: size }} />
);

// ---- Loading spinner Lottie ----
const loadingData = {
  v: "5.7.1", fr: 60, ip: 0, op: 60, w: 100, h: 100, assets: [], layers: [{
    ddd: 0, ind: 1, ty: 4, nm: "spinner", sr: 1,
    ks: {
      o: { a: 0, k: 100 }, r: { a: 1, k: [{ t: 0, s: [0] }, { t: 60, s: [360] }] },
      p: { a: 0, k: [50, 50, 0] }, s: { a: 0, k: [100, 100, 100] }
    },
    shapes: [{
      ty: "gr", it: [
        { ty: "el", d: 1, s: { a: 0, k: [60, 60] }, p: { a: 0, k: [0, 0] } },
        { ty: "st", c: { a: 0, k: [0.39, 0.4, 0.95, 1] }, o: { a: 0, k: 100 }, w: { a: 0, k: 5 }, lc: 2, d: [{ n: "d", v: { a: 0, k: 31 } }, { n: "g", v: { a: 0, k: 94 } }] },
        { ty: "tr", p: { a: 0, k: [50, 50] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } }
      ]
    }]
  }]
};

export const LottieLoading: React.FC<{ size?: number }> = ({ size = 60 }) => (
  <Lottie animationData={loadingData} loop style={{ width: size, height: size }} />
);

export default { LottieSuccess, LottieEmpty, LottieLoading };
