/* Runs inside an opaque-origin sandbox. No WebUI credentials or tool APIs. */
(() => {
  'use strict';
  const target = document.getElementById('openui-root');
  const notice = document.getElementById('notice');
  let reactRoot = null;
  let token = null;

  function reply(type, payload) {
    if (!token) return;
    window.parent.postMessage(Object.assign({
      type: 'hermes-openui:' + type, token
    }, payload || {}), '*');
  }
  function fail() {
    notice.hidden = false;
    notice.textContent = 'OpenUI could not render this message. Use View source.';
    reply('error');
  }
  function height() {
    reply('height', {height: Math.max(target.scrollHeight,
      notice.hidden ? 0 : notice.scrollHeight) + 32});
  }

  window.addEventListener('message', (event) => {
    if (event.source !== window.parent ||
        event.data?.type !== 'hermes-openui:render') return;
    const incoming = event.data;
    if (typeof incoming.token !== 'string' || incoming.token.length > 128 ||
        typeof incoming.response !== 'string' ||
        incoming.response.length > 128 * 1024) return;
    token = incoming.token;
    const ui = window.__OpenUI;
    if (!ui?.React || !ui?.createRoot || !ui?.Renderer || !ui?.openuiChatLibrary) {
      fail();
      return;
    }
    try {
      if (!reactRoot) reactRoot = ui.createRoot(target);
      notice.hidden = true;
      reactRoot.render(ui.React.createElement(ui.Renderer, {
        response: incoming.response, library: ui.openuiChatLibrary
      }));
      requestAnimationFrame(height);
    } catch (_) { fail(); }
  });

  if ('ResizeObserver' in window) new ResizeObserver(height).observe(target);
  window.addEventListener('load', () => {
    window.parent.postMessage({type: 'hermes-openui:ready-request'}, '*');
  });
})();
