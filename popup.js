document.addEventListener('DOMContentLoaded', () => {
    const useReferenceImageCheckbox = document.getElementById('useReferenceImage');
    const openFlowBtn = document.getElementById('openFlowBtn');
    const statusDiv = document.getElementById('status');

    // 設定をロードしてUIに反映
    chrome.storage.sync.get({ useReferenceImage: false }, (items) => {
        useReferenceImageCheckbox.checked = items.useReferenceImage;
    });

    // チェックボックス変更時
    useReferenceImageCheckbox.addEventListener('change', () => {
        saveSettings();
    });

    function saveSettings() {
        const useReferenceImage = useReferenceImageCheckbox.checked;
        const referenceImageCount = 1; // 常に1枚

        chrome.storage.sync.set({
            useReferenceImage: useReferenceImage,
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
