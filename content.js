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



/**
 * モデルを選択するヘルパー関数
 * @param {string} modelName - 選択するモデル名
 * @returns {Promise<boolean>} - 成功したらtrue
 */
async function selectModel(modelName) {
    console.log(`Flow Auto Clicker: Attempting to select '${modelName}'...`);
    try {
        // 設定ボタンを開く (tuneアイコン)
        const settingsBtn = await waitForElement("//button[.//i[contains(text(), 'tune')]]", true, 5000);
        console.log("Flow Auto Clicker: Opening settings...");
        settingsBtn.click();
        await new Promise(r => setTimeout(r, 1000));

        // モデルドロップダウンを開く ("モデル" テキストを含むボタン)
        const modelDropdown = await waitForElement("//button[.//span[contains(text(), 'モデル')]]", true, 5000);
        console.log("Flow Auto Clicker: Opening model dropdown...");
        modelDropdown.click();
        await new Promise(r => setTimeout(r, 2000)); // メニュー展開待ち

        // 指定されたモデルを選択
        let xpath;
        if (modelName === "Nano Banana") {
            // "Nano Banana" の場合は "Pro" を含まないものを探す
            xpath = `//div[(@role='menuitem' or @role='option') and contains(., '${modelName}') and not(contains(., 'Pro'))] | //span[contains(., '${modelName}') and not(contains(., 'Pro'))]`;
        } else {
            // それ以外 (例: Nano Banana Pro) は普通に探す
            xpath = `//div[(@role='menuitem' or @role='option') and contains(., '${modelName}')] | //span[contains(., '${modelName}')]`;
        }

        const modelOption = await waitForElement(xpath, true, 5000).catch(() => null);

        if (modelOption) {
            console.log(`Flow Auto Clicker: Found '${modelName}' option. Clicking...`);
            modelOption.click();
        } else {
            console.warn(`Flow Auto Clicker: '${modelName}' option not found within timeout.`);
        }
        await new Promise(r => setTimeout(r, 1000));

        // 設定画面を閉じるために背景をクリック
        console.log("Flow Auto Clicker: Closing settings...");
        document.body.click();
        await new Promise(r => setTimeout(r, 1000));

        return !!modelOption;

    } catch (e) {
        console.warn(`Flow Auto Clicker: Model selection failed for ${modelName}:`, e);
        try { document.body.click(); } catch (_) { }
        return false;
    }
}

async function runAutomation() {
    try {
        // ---------------------------------------------------------
        // 1. ログアウト状態のチェック（「Flow で作成」ボタンがあるか）
        // ---------------------------------------------------------
        console.log("Flow Auto Clicker: Checking for 'Sign in' button...");
        try {
            const loginBtn = await waitForElement("//button[.//span[contains(text(), 'Flow で作成')]]", true, 5000);
            if (loginBtn) {
                console.log("Flow Auto Clicker: 'Sign in' button found. Clicking to login...");
                loginBtn.click();
                return;
            }
        } catch (e) {
            console.log("Flow Auto Clicker: 'Sign in' button not found, proceeding with automation...");
        }

        // ---------------------------------------------------------
        // 2. 通常の自動化フロー
        // ---------------------------------------------------------

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

        // ---------------------------------------------------------
        // モデル選択機能 (Nano Banana Pro) - 初期選択
        // ---------------------------------------------------------
        await selectModel('Nano Banana Pro');
        // ---------------------------------------------------------

        console.log("Flow Auto Clicker: Waiting for textarea...");
        const textarea = await waitForElement("#PINHOLE_TEXT_AREA_ELEMENT_ID", false);

        console.log("Flow Auto Clicker: Inputting text...");
        textarea.focus();
        textarea.value = PROMPT_TEXT;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));

        console.log("Flow Auto Clicker: Waiting for 'Create' button...");
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

        // ---------------------------------------------------------
        // 時間経過による生成開始判定 (Time-based Fallback)
        // ---------------------------------------------------------
        console.log("Flow Auto Clicker: Verifying generation start...");
        let generationStarted = false;

        // 7秒間チェック (1秒おき)
        for (let i = 0; i < 7; i++) {
            await new Promise(r => setTimeout(r, 1000));

            // 画像数が増えているかチェック
            const currentCount = document.querySelectorAll('img').length;
            if (currentCount > initialImgCount) {
                console.log("Flow Auto Clicker: Generation started!");
                generationStarted = true;
                break;
            }

            // 念のためエラーメッセージもチェック (表示されていたら即打ち切り)
            if (document.body.innerText.includes("1日あたりの上限")) {
                console.warn("Flow Auto Clicker: Limit error detected via text check.");
                generationStarted = false;
                break;
            }
        }

        if (!generationStarted) {
            console.warn("Flow Auto Clicker: Generation did not start within timeout. Switching to Nano Banana...");

            // フォールバック: Nano Banana を選択
            const switched = await selectModel('Nano Banana');

            if (switched) {
                console.log("Flow Auto Clicker: Switched to Nano Banana. Re-inputting text and retrying creation...");

                // モデル切り替え後にテキストが消えるため再入力
                const textarea = await waitForElement("#PINHOLE_TEXT_AREA_ELEMENT_ID", false);
                textarea.focus();
                textarea.value = PROMPT_TEXT;
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
                textarea.dispatchEvent(new Event('change', { bubbles: true }));
                await new Promise(r => setTimeout(r, 500));

                // 少し待ってから作成ボタンを再クリック
                await new Promise(r => setTimeout(r, 1000));
                createBtn.click();
                await new Promise(r => setTimeout(r, 1000));
                createBtn.click(); // 念のため2回
            } else {
                console.error("Flow Auto Clicker: Failed to switch model.");
            }
        }
        // ---------------------------------------------------------

        console.log("Flow Auto Clicker: Waiting for new image generation...");

        // 画像が増えるのを待つ関数 (タイムアウト付き)
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
        console.log("Flow Auto Clicker: New image found. Waiting before hover...");
        await new Promise(r => setTimeout(r, 1000));

        console.log("Flow Auto Clicker: Simulating hover...", newImage);

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

        // 少し待機（ダウンロード失敗防止のため長めに）
        console.log("Flow Auto Clicker: Waiting before clicking download...");
        await new Promise(r => setTimeout(r, 3000));

        console.log("Flow Auto Clicker: Clicking 'Download' button...");
        downloadBtn.click();

        // 追加: モデルによってダウンロードオプション (1K, 2K...) が出る場合がある
        console.log("Flow Auto Clicker: Checking for download options (1K)...");
        try {
            await new Promise(r => setTimeout(r, 2000));
            // "1K" を含む要素を探す (ポップアップメニュー内)
            // テキストを含む span や div を探す
            const option1k = await waitForElement("//*[contains(text(), '1K')]", true, 3000);
            if (option1k) {
                console.log("Flow Auto Clicker: '1K' download option found. Clicking...");
                option1k.click();
            } else {
                console.log("Flow Auto Clicker: No '1K' option found (continuing)...");
            }
        } catch (e) {
            console.log("Flow Auto Clicker: Download option check timed out or failed (likely direct download).");
        }

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
