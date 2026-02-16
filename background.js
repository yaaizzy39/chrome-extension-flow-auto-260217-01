chrome.action.onClicked.addListener((tab) => {
  const targetUrl = "https://labs.google/fx/ja/tools/flow";
  chrome.tabs.create({ url: targetUrl });
});
