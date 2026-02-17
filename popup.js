document.addEventListener('DOMContentLoaded', () => {
    const useReferenceImageCheckbox = document.getElementById('useReferenceImage');
    const referenceImageCountInput = document.getElementById('referenceImageCount');
    const imageCountContainer = document.getElementById('imageCountContainer');
    const openFlowBtn = document.getElementById('openFlowBtn');
    const statusDiv = document.getElementById('status');

    // 設定をロードしてUIに反映
    chrome.storage.sync.get({ useReferenceImage: false, referenceImageCount: 1 }, (items) => {
        useReferenceImageCheckbox.checked = items.useReferenceImage;
        referenceImageCountInput.value = items.referenceImageCount;
        toggleImageCountVisibility(items.useReferenceImage);
    });

    // チェックボックス変更時
    useReferenceImageCheckbox.addEventListener('change', () => {
        const useReferenceImage = useReferenceImageCheckbox.checked;
        toggleImageCountVisibility(useReferenceImage);
        saveSettings();
    });

    // 枚数変更時
    referenceImageCountInput.addEventListener('change', () => {
        saveSettings();
    });

    function toggleImageCountVisibility(show) {
        if (imageCountContainer) {
            imageCountContainer.style.display = show ? 'block' : 'none';
        }
    }

    function saveSettings() {
        const useReferenceImage = useReferenceImageCheckbox.checked;
        const referenceImageCount = parseInt(referenceImageCountInput.value, 10) || 1;

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
