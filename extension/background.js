const ext = globalThis.browser ?? globalThis.chrome;
const MENU_ID = 'project-purify-selection';

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

  await ext.storage.session.set({
    pendingText: info.selectionText,
    pendingSource: 'context-menu'
  });

  try {
    await ext.action.openPopup();
  } catch {
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
