// コンテンツスクリプトからのメッセージを受信してタブを閉じる
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "close_tab" && sender.tab) {
    chrome.tabs.remove(sender.tab.id);
  }
});
