document.addEventListener('DOMContentLoaded', () => {
    const useReferenceImageCheckbox = document.getElementById('useReferenceImage');
    const openFlowBtn = document.getElementById('openFlowBtn');
    const statusDiv = document.getElementById('status');

    // 設定をロードしてUIに反映
    chrome.storage.sync.get({ useReferenceImage: false }, (items) => {
        useReferenceImageCheckbox.checked = items.useReferenceImage;
    });

    // チェックボックス変更時に保存
    useReferenceImageCheckbox.addEventListener('change', () => {
        const useReferenceImage = useReferenceImageCheckbox.checked;
        chrome.storage.sync.set({ useReferenceImage: useReferenceImage }, () => {
            // 保存完了表示
            statusDiv.classList.add('visible');
            setTimeout(() => {
                statusDiv.classList.remove('visible');
            }, 1500);
        });
    });

    // Flowを開くボタン
    openFlowBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: "https://labs.google/fx/ja/tools/flow" });
        window.close(); // ポップアップを閉じる
    });
});
