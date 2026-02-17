document.addEventListener('DOMContentLoaded', () => {
    const useReferenceImageCheckbox = document.getElementById('useReferenceImage');
    const autoCloseTabCheckbox = document.getElementById('autoCloseTab');
    const referenceImageSuffixInput = document.getElementById('referenceImageSuffix');
    const openFlowBtn = document.getElementById('openFlowBtn');
    const statusDiv = document.getElementById('status');

    // 設定をロードしてUIに反映
    chrome.storage.sync.get({
        useReferenceImage: false,
        autoCloseTab: false,
        referenceImageSuffix: " and a [very tiny] character from the attached image"
    }, (items) => {
        useReferenceImageCheckbox.checked = items.useReferenceImage;
        autoCloseTabCheckbox.checked = items.autoCloseTab;
        referenceImageSuffixInput.value = items.referenceImageSuffix;
    });

    // チェックボックス変更時
    useReferenceImageCheckbox.addEventListener('change', () => {
        saveSettings();
    });

    autoCloseTabCheckbox.addEventListener('change', () => {
        saveSettings();
    });

    // テキストエリア変更時
    referenceImageSuffixInput.addEventListener('change', () => {
        saveSettings();
    });

    function saveSettings() {
        const useReferenceImage = useReferenceImageCheckbox.checked;
        const autoCloseTab = autoCloseTabCheckbox.checked;
        const referenceImageSuffix = referenceImageSuffixInput.value;
        const referenceImageCount = 1; // 常に1枚

        chrome.storage.sync.set({
            useReferenceImage: useReferenceImage,
            autoCloseTab: autoCloseTab,
            referenceImageSuffix: referenceImageSuffix,
            referenceImageCount: referenceImageCount
        }, () => {
            // 保存完了表示
            if (statusDiv) {
                statusDiv.classList.add('visible');
                setTimeout(() => {
                    statusDiv.classList.remove('visible');
                }, 1500);
            }
        });
    }

    // Flowを開くボタン
    if (openFlowBtn) {
        openFlowBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: "https://labs.google/fx/ja/tools/flow" });
            window.close(); // ポップアップを閉じる
        });
    }
});
