console.log("Flow Auto Clicker: Script loaded");

// 設定：入力するテキスト
const PROMPT_TEXT = "指定の文字列";

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
        const createBtn = await waitForElement("//button[contains(., '作成')]", true);

        // UIの更新待ち
        await new Promise(r => setTimeout(r, 1000));

        console.log("Flow Auto Clicker: Clicking 'Create' button...");
        createBtn.click();

        console.log("Flow Auto Clicker: Automation sequence completed.");

    } catch (error) {
        console.error("Flow Auto Clicker Error:", error);
    }
}

// 実行開始
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAutomation);
} else {
    runAutomation();
}
