// 設定の保存
const saveOptions = () => {
    const useReferenceImage = document.getElementById('useReferenceImage').checked;
    const referenceImageSuffix = document.getElementById('referenceImageSuffix').value;

    chrome.storage.sync.set(
        {
            useReferenceImage: useReferenceImage,
            referenceImageSuffix: referenceImageSuffix
        },
        () => {
            // 保存完了メッセージを表示
            const status = document.getElementById('status');
            status.textContent = '設定を保存しました。';
            setTimeout(() => {
                status.textContent = '';
            }, 1500);
        }
    );
};

// 設定の読み込み
const restoreOptions = () => {
    chrome.storage.sync.get(
        {
            useReferenceImage: false,
            referenceImageSuffix: " and a [very tiny] character in various poses and expressions from the attached image"
        }, // デフォルト値
        (items) => {
            document.getElementById('useReferenceImage').checked = items.useReferenceImage;
            document.getElementById('referenceImageSuffix').value = items.referenceImageSuffix;
        }
    );
};

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('useReferenceImage').addEventListener('change', saveOptions);
