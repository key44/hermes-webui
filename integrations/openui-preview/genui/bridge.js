/* Render OpenUI fenced blocks in existing Hermes transcript (read-only PoC).
 * No generated action is ever forwarded to the agent or host filesystem.
 */
(() => {
  'use strict';
  const MAX_BYTES = 128 * 1024;
  const selector = 'pre > code.language-openui, pre > code.language-openui-lang';
  const frameUrl = new URL('extensions/genui/frame.html', document.baseURI).href;
  const objects = new WeakMap();
  const active = new Set();
  const encoder = new TextEncoder();
  let queued = false;

  function send(item) {
    if (!item.ready || !item.iframe.contentWindow) return;
    // Sandbox has opaque origin: "*" is required, but no secrets/actions are sent.
    item.iframe.contentWindow.postMessage({
      type: 'hermes-openui:render', token: item.token, response: item.source
    }, '*');
  }

  function mount(pre, code) {
    const source = code.textContent || '';
    if (!source.trim() || encoder.encode(source).length > MAX_BYTES) return;
    const section = document.createElement('section');
    section.className = 'hermes-openui-preview';
    const bar = document.createElement('div');
    bar.className = 'hermes-openui-header';
    const label = document.createElement('span');
    label.textContent = 'OpenUI preview';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'hermes-openui-source-button';
    button.textContent = 'View source';
    button.setAttribute('aria-expanded', 'false');
    bar.append(label, button);
    const iframe = document.createElement('iframe');
    iframe.className = 'hermes-openui-frame';
    iframe.title = 'OpenUI generated interface';
    iframe.setAttribute('sandbox', 'allow-scripts');
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('referrerpolicy', 'no-referrer');
    iframe.src = frameUrl;
    iframe.style.height = '100px';
    const note = document.createElement('div');
    note.className = 'hermes-openui-note';
    note.setAttribute('role', 'status');
    note.textContent = 'Loading OpenUI preview…';
    section.append(bar, iframe, note);
    pre.parentNode.insertBefore(section, pre);
    pre.hidden = true;
    const item = {pre, iframe, note, section, token: crypto.randomUUID(), source, ready: false};
    objects.set(pre, item);
    active.add(item);
    button.addEventListener('click', () => {
      const showSource = pre.hidden;
      pre.hidden = !showSource;
      iframe.hidden = showSource;
      button.textContent = showSource ? 'Show preview' : 'View source';
      button.setAttribute('aria-expanded', String(showSource));
    });
  }

  function scan() {
    queued = false;
    const root = document.getElementById('msgInner');
    if (!root) return;
    for (const code of root.querySelectorAll(selector)) {
      const pre = code.closest('pre');
      if (!pre || !pre.parentNode) continue;
      const source = code.textContent || '';
      const size = encoder.encode(source).length;
      const item = objects.get(pre);
      if (!item) {
        if (size <= MAX_BYTES) mount(pre, code);
      } else if (size <= MAX_BYTES && item.source !== source) {
        item.source = source;
        send(item);
      }
    }
    for (const item of active) if (!item.section.isConnected) active.delete(item);
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(scan);
  }

  window.addEventListener('message', (event) => {
    const data = event.data;
    if (!data || typeof data !== 'object' ||
        !String(data.type || '').startsWith('hermes-openui:')) return;
    for (const item of active) {
      if (event.source !== item.iframe.contentWindow) continue;
      if (data.type === 'hermes-openui:ready-request') {
        item.ready = true;
        item.note.textContent = '';
        send(item);
      } else if (data.token === item.token) {
        if (data.type === 'hermes-openui:height') {
          const h = Number(data.height);
          if (Number.isFinite(h)) {
            item.iframe.style.height = Math.min(1800, Math.max(100, Math.ceil(h))) + 'px';
          }
        } else if (data.type === 'hermes-openui:error') {
          item.note.textContent = 'Preview unavailable. Select View source to inspect the original.';
        }
      }
      break;
    }
  });

  function boot() {
    const root = document.getElementById('msgInner');
    if (!root) return;
    new MutationObserver(schedule).observe(root, {
      childList: true, subtree: true, characterData: true
    });
    schedule();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, {once: true});
  } else boot();
})();
