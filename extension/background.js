const MENU_ID = 'project-purify-selection';

chrome.runtime.onInstalled.addListener(async () => {
  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({
    id: MENU_ID,
    title: 'Analyze selection with Project Purify',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== MENU_ID || !info.selectionText) return;

  await chrome.storage.session.set({
    pendingText: info.selectionText,
    pendingSource: 'context-menu'
  });

  try {
    await chrome.action.openPopup();
  } catch {
    await chrome.action.setBadgeText({ text: '!' });
    await chrome.action.setBadgeBackgroundColor({ color: '#6b7280' });
  }
});

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type !== 'purify:finding-summary') return;
  const count = Number(message.count) || 0;
  chrome.action.setBadgeText({ text: count > 0 ? String(Math.min(count, 99)) : '' });
  if (count > 0) chrome.action.setBadgeBackgroundColor({ color: '#6b7280' });
});
