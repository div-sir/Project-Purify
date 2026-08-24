const ext = globalThis.browser ?? globalThis.chrome;
const MENU_ID = 'project-purify-selection';
const MAX_PENDING_TEXT = 1024 * 1024;
const PENDING_KEYS = ['pendingText', 'pendingSource', 'pendingTruncated'];

ext.runtime.onInstalled.addListener(async () => {
  await ext.contextMenus.removeAll();
  ext.contextMenus.create({
    id: MENU_ID,
    title: 'Analyze selection with Project Purify',
    contexts: ['selection']
  });
});

ext.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== MENU_ID || !info.selectionText) return;

  const bounded = info.selectionText.slice(0, MAX_PENDING_TEXT);
  await ext.storage.session.set({
    pendingText: bounded,
    pendingSource: 'context-menu',
    pendingTruncated: info.selectionText.length > bounded.length
  });

  try {
    await ext.action.openPopup();
  } catch {
    await ext.storage.session.remove(PENDING_KEYS);
    await ext.action.setBadgeText({ text: '!' });
    await ext.action.setBadgeBackgroundColor({ color: '#6b7280' });
  }
});

ext.runtime.onMessage.addListener((message) => {
  if (message?.type !== 'purify:finding-summary') return;
  const count = Number(message.count) || 0;
  ext.action.setBadgeText({ text: count > 0 ? String(Math.min(count, 99)) : '' });
  if (count > 0) ext.action.setBadgeBackgroundColor({ color: '#6b7280' });
});
