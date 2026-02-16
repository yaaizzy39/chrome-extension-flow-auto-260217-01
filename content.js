console.log("Flow Auto Clicker: Script loaded");

// 設定：入力するテキスト（URLパラメータ "prompt" があればそれを使用、なければデフォルト）
const urlParams = new URLSearchParams(window.location.search);
const promptParam = urlParams.get('prompt');
// デコード処理が必要な場合は自動で行われるが、念のため
const PROMPT_TEXT = promptParam ? decodeURIComponent(promptParam) : "可愛いアヒルのイラスト";

console.log(`Flow Auto Clicker: Target prompt is "${PROMPT_TEXT}"`);

/**
 * 指定されたXPathまたはCSSセレクタに一致する要素が現れるまで待機する関数
 * @param {string} selectorOrXpath - 検索用文字列
 * @param {boolean} isXpath - XPathかどうか
 * @param {number} timeout - タイムアウト時間(ms)
 * @returns {Promise<Element>}
 */
function waitForElement(selectorOrXpath, isXpath = false, timeout = 30000) {
    return new Promise((resolve, reject) => {
        // 既存要素の検索
        const element = findElement(selectorOrXpath, isXpath);
        if (element) {
            resolve(element);
            return;
        }

        // DOM監視
        const observer = new MutationObserver((mutations) => {
            const element = findElement(selectorOrXpath, isXpath);
            if (element) {
                observer.disconnect();
                resolve(element);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // タイムアウト
        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Element not found within ${timeout}ms: ${selectorOrXpath}`));
        }, timeout);
    });
}

function findElement(selector, isXpath) {
    if (isXpath) {
        const result = document.evaluate(selector, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        return result.singleNodeValue;
    } else {
        return document.querySelector(selector);
    }
}

async function runAutomation() {
    try {
        console.log("Flow Auto Clicker: Waiting for 'New Project' button...");
        const newProjectBtn = await waitForElement("//button[contains(., '新しいプロジェクト')]", true);

        console.log("Flow Auto Clicker: Clicking 'New Project' button...");
        newProjectBtn.click();

        // 追加ステップ: 「画像」ボタンをクリック
        console.log("Flow Auto Clicker: Waiting for 'Image' button...");
        const imageBtn = await waitForElement("//button[contains(., '画像')]", true);

        // 少し待機してからクリック
        await new Promise(r => setTimeout(r, 500));

        console.log("Flow Auto Clicker: Clicking 'Image' button...");
        imageBtn.click();

        console.log("Flow Auto Clicker: Waiting for textarea...");
        const textarea = await waitForElement("#PINHOLE_TEXT_AREA_ELEMENT_ID", false);

        console.log("Flow Auto Clicker: Inputting text...");
        textarea.focus();
        textarea.value = PROMPT_TEXT;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));

        console.log("Flow Auto Clicker: Waiting for 'Create' button...");
        // 「arrow_forward」アイコンを含むボタン（＝作成ボタン）を検索
        // ノート: 「作成」テキストで検索すると「画像を作成」ボタンもヒットしてしまうため、アイコンで特定する
        const createBtn = await waitForElement("//button[.//i[contains(text(), 'arrow_forward')]]", true);

        // UIの更新待ち
        await new Promise(r => setTimeout(r, 1000));

        // 事前に現在の画像数をカウント
        const initialImgCount = document.querySelectorAll('img').length;
        console.log(`Flow Auto Clicker: Initial image count: ${initialImgCount}`);

        console.log("Flow Auto Clicker: Clicking 'Create' button (Attempt 1)...");
        createBtn.click();

        // 自動補完メニューなどを閉じるためのクリックになる可能性があるため、少し待って再クリック
        await new Promise(r => setTimeout(r, 1000));

        console.log("Flow Auto Clicker: Clicking 'Create' button (Attempt 2)...");
        createBtn.click();

        console.log("Flow Auto Clicker: Waiting for new image generation...");

        // 画像が増えるのを待つ関数
        const waitForNewImage = async (initialCount, timeout = 120000) => {
            const startTime = Date.now();
            while (Date.now() - startTime < timeout) {
                const currentImages = document.querySelectorAll('img');
                if (currentImages.length > initialCount) {
                    return currentImages[currentImages.length - 1]; // 最後に追加された画像を返す
                }
                await new Promise(r => setTimeout(r, 1000));
            }
            throw new Error("Timeout waiting for new image");
        };

        const newImage = await waitForNewImage(initialImgCount);
        console.log("Flow Auto Clicker: New image found. Simulating hover...", newImage);

        // 新しい画像要素とその親要素にホバーイベントを送る
        let target = newImage;
        const hoverEvent = new MouseEvent('mouseover', { bubbles: true, cancelable: true, view: window });
        const enterEvent = new MouseEvent('mouseenter', { bubbles: true, cancelable: true, view: window });
        const moveEvent = new MouseEvent('mousemove', { bubbles: true, cancelable: true, view: window });

        // 親要素を遡ってイベント発火
        for (let i = 0; i < 7; i++) { // 少し深めに探索
            if (!target) break;
            target.dispatchEvent(hoverEvent);
            target.dispatchEvent(enterEvent);
            target.dispatchEvent(moveEvent);
            target = target.parentElement;
        }

        console.log("Flow Auto Clicker: Waiting for 'Download' button...");
        // 生成待ち。ダウンロードボタンが表示されるまで待機
        const downloadBtn = await waitForElement("//button[.//i[contains(text(), 'download')]]", true, 10000);

        // 少し待機
        await new Promise(r => setTimeout(r, 1000));

        console.log("Flow Auto Clicker: Clicking 'Download' button...");
        downloadBtn.click();

        console.log("Flow Auto Clicker: Waiting for download to start...");
        // ダウンロード開始の猶予として3秒待機
        await new Promise(r => setTimeout(r, 3000));

        console.log("Flow Auto Clicker: Closing tab...");
        chrome.runtime.sendMessage({ action: "close_tab" });

        console.log("Flow Auto Clicker: Automation sequence completed.");

    } catch (error) {
        console.error("Flow Auto Clicker Error:", error);
    }
}

// 実行開始
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (promptParam) {
            runAutomation();
        } else {
            console.log("Flow Auto Clicker: No prompt parameter found. Automation skipped.");
        }
    });
} else {
    if (promptParam) {
        runAutomation();
    } else {
        console.log("Flow Auto Clicker: No prompt parameter found. Automation skipped.");
    }
}
