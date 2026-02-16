chrome.action.onClicked.addListener((tab) => {
  const targetUrl = "https://labs.google/fx/ja/tools/flow";
  chrome.tabs.create({ url: targetUrl });
});

// コンテンツスクリプトからのメッセージを受信してタブを閉じる
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "close_tab" && sender.tab) {
    chrome.tabs.remove(sender.tab.id);
  }
});
