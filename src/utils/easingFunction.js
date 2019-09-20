export function easeOutBack (t, b, c, d, s) {
  if (s == undefined) s = 1.70158;
  return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
}

export function easeOutCirc (t, b, c, d) {
  return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
}

