// 設定の保存
const saveOptions = () => {
    const useReferenceImage = document.getElementById('useReferenceImage').checked;

    chrome.storage.sync.set(
        { useReferenceImage: useReferenceImage },
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
        { useReferenceImage: false }, // デフォルト値
        (items) => {
            document.getElementById('useReferenceImage').checked = items.useReferenceImage;
        }
    );
};

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('useReferenceImage').addEventListener('change', saveOptions);
