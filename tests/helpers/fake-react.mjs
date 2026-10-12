// React palsu minimal (useState/useRef/useCallback/useMemo/useEffect + jsx-runtime)
// agar komponen klien bisa dijalankan di `node --test` tanpa DOM/jsdom.
// Cukup untuk satu komponen tanpa anak berstatus (MicButton).

export const Fragment = Symbol.for('fake.fragment');

export function jsx(type, props) {
  return { type, props: props ?? {} };
}
export const jsxs = jsx;
export const jsxDEV = jsx;

let current = null;

function depsChanged(prev, next) {
  if (!prev || !next) return true;
  if (prev.length !== next.length) return true;
  return next.some((d, i) => !Object.is(d, prev[i]));
}

function nextHook(init) {
  if (!current) throw new Error('Hook dipanggil di luar render');
  const inst = current;
  const i = inst.idx++;
  if (!(i in inst.hooks)) inst.hooks[i] = init();
  return { inst, hook: inst.hooks[i] };
}

export function useState(initial) {
  const { inst, hook } = nextHook(() => ({
    value: typeof initial === 'function' ? initial() : initial,
  }));
  if (!hook.setter) {
    hook.setter = (v) => {
      const next = typeof v === 'function' ? v(hook.value) : v;
      if (Object.is(next, hook.value)) return;
      hook.value = next;
      inst.schedule();
    };
  }
  return [hook.value, hook.setter];
}

export function useRef(initial) {
  const { hook } = nextHook(() => ({ ref: { current: initial } }));
  return hook.ref;
}

export function useMemo(factory, deps) {
  const { hook } = nextHook(() => ({ deps: undefined, value: undefined, init: false }));
  if (!hook.init || depsChanged(hook.deps, deps)) {
    hook.value = factory();
    hook.deps = deps;
    hook.init = true;
  }
  return hook.value;
}

export function useCallback(fn, deps) {
  return useMemo(() => fn, deps);
}

export function useEffect(effect, deps) {
  const { inst, hook } = nextHook(() => ({ deps: undefined, cleanup: null, init: false }));
  if (!hook.init || depsChanged(hook.deps, deps)) {
    hook.init = true;
    hook.deps = deps;
    inst.pending.push({ hook, effect });
  }
}

export default { useState, useRef, useMemo, useCallback, useEffect, Fragment };

/** Pasang komponen. `getProps()` dibaca ulang setiap render (props terkontrol). */
export function mount(Component, getProps) {
  const inst = {
    hooks: [],
    idx: 0,
    pending: [],
    tree: null,
    scheduled: false,
    unmounted: false,
    schedule() {
      if (inst.scheduled || inst.unmounted) return;
      inst.scheduled = true;
      queueMicrotask(() => {
        if (inst.scheduled && !inst.unmounted) render();
      });
    },
  };

  function render() {
    inst.scheduled = false;
    inst.idx = 0;
    inst.pending = [];
    current = inst;
    try {
      inst.tree = Component(getProps());
    } finally {
      current = null;
    }
    const effects = inst.pending;
    inst.pending = [];
    for (const { hook } of effects) {
      if (hook.cleanup) hook.cleanup();
      hook.cleanup = null;
    }
    for (const e of effects) {
      const c = e.effect();
      e.hook.cleanup = typeof c === 'function' ? c : null;
    }
  }

  render();

  return {
    rerender: render,
    get tree() {
      return inst.tree;
    },
    unmount() {
      inst.unmounted = true;
      for (const h of inst.hooks) if (h && typeof h.cleanup === 'function') h.cleanup();
    },
  };
}

/** Teks gabungan dari pohon jsx palsu. */
export function textOf(node) {
  if (node == null || node === false || node === true) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  return textOf(node.props?.children);
}

/** Cari elemen pertama yang cocok dengan predikat. */
export function findNode(node, pred) {
  if (node == null || typeof node !== 'object') return null;
  if (Array.isArray(node)) {
    for (const n of node) {
      const f = findNode(n, pred);
      if (f) return f;
    }
    return null;
  }
  if (pred(node)) return node;
  return findNode(node.props?.children, pred);
}
