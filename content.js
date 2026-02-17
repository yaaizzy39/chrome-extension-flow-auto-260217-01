console.log("Flow Auto Clicker: Script loaded");

// 設定：入力するテキスト（URLパラメータ "prompt" があればそれを使用、なければデフォルト）
const urlParams = new URLSearchParams(window.location.search);
const promptParam = urlParams.get('prompt');
// デコード処理が必要な場合は自動で行われるが、念のため
let rawPrompt = promptParam ? decodeURIComponent(promptParam) : "可愛いアヒルのイラスト";

// [ref] / [notref] タグの処理
let forceUseRef = false;
let forceNoRef = false;

if (rawPrompt.startsWith("[ref]")) {
    forceUseRef = true;
    rawPrompt = rawPrompt.slice("[ref]".length);
    console.log("Flow Auto Clicker: Detected [ref] tag. Forcing reference image usage.");
} else if (rawPrompt.startsWith("[notref]")) {
    forceNoRef = true;
    rawPrompt = rawPrompt.slice("[notref]".length);
    console.log("Flow Auto Clicker: Detected [notref] tag. Forcing NO reference image usage.");
}

let PROMPT_TEXT = rawPrompt;

console.log(`Flow Auto Clicker: Initial target prompt is "${PROMPT_TEXT}"`);



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
 * 設定（モデル・枚数）を変更するヘルパー関数
 * @param {string} modelName - 選択するモデル名
 * @param {number} targetImageCount - 生成枚数 (デフォルト1)
 * @returns {Promise<boolean>} - モデル選択に成功したらtrue
 */
async function configureSettings(modelName, targetImageCount = 1) {
    console.log(`Flow Auto Clicker: Attempting to configure settings (Model: ${modelName}, Count: ${targetImageCount})...`);

    const closeSettings = async () => {
        console.log("Flow Auto Clicker: Closing settings...");
        document.body.click();
        await new Promise(r => setTimeout(r, 1500)); // 1000 -> 1500
        // 念のためもう一度
        try { document.body.click(); } catch (_) { }
    };

    try {
        // 設定ボタンを開く (tuneアイコン)
        const settingsBtn = await waitForElement("//button[.//i[contains(text(), 'tune')]]", true, 5000);
        console.log("Flow Auto Clicker: Opening settings...");
        settingsBtn.click();
        await new Promise(r => setTimeout(r, 1500)); // 1000 -> 1500

        // -------------------------------------------------
        // 1. モデル選択
        // -------------------------------------------------
        // モデルドロップダウンを開く ("モデル" テキストを含むボタン)
        const modelDropdown = await waitForElement("//button[.//span[contains(text(), 'モデル')]]", true, 5000);
        console.log("Flow Auto Clicker: Opening model dropdown...");
        modelDropdown.click();
        await new Promise(r => setTimeout(r, 2500)); // 2000 -> 2500 メニュー展開待ち

        // 指定されたモデルを選択
        let modelXpath;
        if (modelName === "Nano Banana") {
            // "Nano Banana" の場合は "Pro" を含まないものを探す
            modelXpath = `//div[(@role='menuitem' or @role='option') and contains(., '${modelName}') and not(contains(., 'Pro'))] | //span[contains(., '${modelName}') and not(contains(., 'Pro'))]`;
        } else {
            // それ以外 (例: Nano Banana Pro) は普通に探す
            modelXpath = `//div[(@role='menuitem' or @role='option') and contains(., '${modelName}')] | //span[contains(., '${modelName}')]`;
        }

        const modelOption = await waitForElement(modelXpath, true, 5000).catch(() => null);

        if (modelOption) {
            console.log(`Flow Auto Clicker: Found '${modelName}' option. Clicking...`);
            modelOption.click();
        } else {
            console.warn(`Flow Auto Clicker: '${modelName}' option not found within timeout.`);
        }
        await new Promise(r => setTimeout(r, 1500)); // 1000 -> 1500

        // -------------------------------------------------
        // 2. 枚数選択 ("プロンプトごとの出力")
        // -------------------------------------------------
        console.log(`Flow Auto Clicker: Attempting to set image count to ${targetImageCount}...`);
        try {
            // "プロンプトごとの出力" を含むボタンまたはその周辺のボタンを探す
            // Many UI frameworks put the label inside the button or near it.
            const countDropdown = await waitForElement("//button[.//span[contains(text(), 'プロンプトごとの出力')]]", true, 3000);
            if (countDropdown) {
                countDropdown.click();
                await new Promise(r => setTimeout(r, 1500)); // 1000 -> 1500

                // 数値のオプションを選択 (例: "1")
                // 複数のパターンで探す
                const countXpath = [
                    `//div[@role='menuitem' and .//span[text()='${targetImageCount}']]`, // span内の完全一致
                    `//div[@role='menuitem' and text()='${targetImageCount}']`, // 直下のテキスト
                    `//span[text()='${targetImageCount}']`, // 単純なspan
                    `//*[text()='${targetImageCount}']` // 最終手段
                ].join(" | ");

                const countOption = await waitForElement(countXpath, true, 3000);

                if (countOption) {
                    console.log(`Flow Auto Clicker: Found count option '${targetImageCount}'. Clicking...`);
                    countOption.click();
                } else {
                    console.warn(`Flow Auto Clicker: Count option '${targetImageCount}' not found.`);
                }
                await new Promise(r => setTimeout(r, 1500)); // 1000 -> 1500
            } else {
                console.warn("Flow Auto Clicker: Image count dropdown not found.");
            }
        } catch (e) {
            console.warn("Flow Auto Clicker: Failed to set image count:", e);
        }

        // -------------------------------------------------
        // 設定画面を閉じる
        // -------------------------------------------------
        await closeSettings();

        return !!modelOption; // モデル選択の結果を返す

    } catch (e) {
        console.warn(`Flow Auto Clicker: Settings configuration failed:`, e);
        // エラー時も閉じる試みをする
        try { document.body.click(); } catch (_) { }
        return false;
    }
}

/**
 * 画像ファイルをアップロードする関数
 */
/**
 * 履歴から参照画像を選択する関数
 * @param {number} count - 選択する画像の枚数
 */
async function selectReferenceImagesFromHistory(count) {
    const validCount = parseInt(count, 10) || 1;
    console.log(`Flow Auto Clicker: Starting reference image selection from history (Count: ${count} -> ${validCount})...`);

    for (let i = 0; i < validCount; i++) {
        try {
            console.log(`Flow Auto Clicker: Processing image selection ${i + 1}/${count}...`);

            // 1. 「参照画像追加ボタン」を探してクリック
            console.log("Flow Auto Clicker: Searching for 'Add Reference Image' button...");

            let addBtn = null;
            // ユーザー提供のHTMLに基づくセレクタ試行
            // <button ...><i ...>add</i><div data-type="button-overlay" ...></div></button>
            const strategies = [
                "//button[.//i[text()='add']]",                 // 基本: iタグのテキストがadd
                "//button[.//i[contains(@class, 'google-symbols') and text()='add']]", // クラス指定
                "//button[div[@data-type='button-overlay'] and .//i[text()='add']]", // 内部構造（オーバーレイあり）
                "//button[.//i[contains(text(), 'add')]]"       // 以前の方法 (fallback)
            ];

            for (const xpath of strategies) {
                try {
                    addBtn = await waitForElement(xpath, true, 2000);
                    if (addBtn) {
                        console.log(`Flow Auto Clicker: Found 'Add' button using xpath: ${xpath}`);
                        break;
                    }
                } catch (e) {
                    // ignore and try next
                }
            }

            if (!addBtn) {
                console.error("Flow Auto Clicker: 'Add Reference Image' button NOT found after trying all strategies.");
                throw new Error("Add Reference Image button not found");
            }

            console.log("Flow Auto Clicker: Clicking 'Add Reference Image' button...");
            // 確実にクリックするためにスクロール
            addBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await new Promise(r => setTimeout(r, 1000)); // 500 -> 1000
            addBtn.click();

            // 修正: 最新の画像がロードされるのを待つため、待機時間を延長 (2秒 -> 5秒)
            console.log("Flow Auto Clicker: Waiting for history dialog to load...");
            await new Promise(r => setTimeout(r, 5000));

            // 2. 履歴画像ボタンを探す
            // "以前にアップロードまたは選択したメディア アセット" を含む span を持つボタン
            // または、このテキストを含む要素の親ボタン
            const historyBtnXpath = "//button[.//span[contains(text(), '以前にアップロード')]]";

            // 少し待つ
            try {
                await waitForElement(historyBtnXpath, true, 5000);
            } catch (e) {
                console.warn("Flow Auto Clicker: History images not found.");
                // キャンセルボタンがあれば閉じる、なければ外側クリックなどで閉じる必要があるが、
                // とりあえず見つからない場合は次へ（次のループでも失敗する可能性高いが）
                continue;
            }

            const historyBtns = document.evaluate(historyBtnXpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

            if (historyBtns.snapshotLength > i) {
                const targetBtn = historyBtns.snapshotItem(i); // i番目の画像を選択（0始まり）
                console.log(`Flow Auto Clicker: Clicking history image index ${i}`);
                targetBtn.click();

                // 3. 「切り抜きして保存」ボタンの処理 (存在する場合)
                // 画像クリック後にダイアログが出るか、そのまま追加されるか。
                // ユーザー報告によると「切り抜きして保存」が出る可能性がある。
                await new Promise(r => setTimeout(r, 2500)); // 2000 -> 2500

                console.log("Flow Auto Clicker: Checking for 'Crop and Save' button...");
                try {
                    // ボタンのテキストまたはアイコンで探す
                    const cropSaveBtn = await waitForElement("//button[contains(., '切り抜きして保存')]", true, 3000);
                    if (cropSaveBtn) {
                        console.log("Flow Auto Clicker: 'Crop and Save' button found. Clicking...");
                        cropSaveBtn.click();
                        // ダイアログが閉じるのを待つ
                        await new Promise(r => setTimeout(r, 2500)); // 2000 -> 2500
                    }
                } catch (e) {
                    console.log("Flow Auto Clicker: 'Crop and Save' button not found (skipped or not needed).");
                }

                // 追加後のUI更新待ち
                await new Promise(r => setTimeout(r, 1500)); // 1000 -> 1500

            } else {
                console.warn(`Flow Auto Clicker: Not enough history images found. Requested index ${i}, found ${historyBtns.snapshotLength}.`);
                // ダイアログを閉じる処理が必要かもしれないが、今はスキップ
                // エスケープキーを送る等を試みる価値はある
                document.body.click(); // 背景クリックで閉じることを期待
                break;
            }

        } catch (e) {
            console.error(`Flow Auto Clicker: Failed to select history image:`, e);
        }
    }
}

async function runAutomation() {
    try {
        // 設定読み込み
        const settings = await chrome.storage.sync.get({
            useReferenceImage: false,
            referenceImageCount: 1,
            autoCloseTab: false,
            referenceImageSuffix: " and a [very tiny] character from the attached image"
        });

        // タグによる強制上書き
        if (forceUseRef) {
            settings.useReferenceImage = true;
            console.log("Flow Auto Clicker: Overriding settings -> useReferenceImage = true (due to [ref])");
        } else if (forceNoRef) {
            settings.useReferenceImage = false;
            console.log("Flow Auto Clicker: Overriding settings -> useReferenceImage = false (due to [notref])");
        }

        console.log(`Flow Auto Clicker: Settings loaded (final). useReferenceImage = ${settings.useReferenceImage}, Count = ${settings.referenceImageCount}`);

        if (settings.useReferenceImage) {
            const suffix = settings.referenceImageSuffix;
            PROMPT_TEXT += suffix;
            console.log(`Flow Auto Clicker: Amended prompt: "${PROMPT_TEXT}"`);
        }

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
        await new Promise(r => setTimeout(r, 1000)); // 500 -> 1000

        console.log("Flow Auto Clicker: Clicking 'Image' button...");
        imageBtn.click();

        // ---------------------------------------------------------
        // モデル・設定選択 (Nano Banana Pro, 1枚) - 初期選択
        // ---------------------------------------------------------
        await configureSettings('Nano Banana Pro', 1);

        // ---------------------------------------------------------
        // 参照画像アップロード (履歴から選択)
        // ---------------------------------------------------------
        if (settings.useReferenceImage) {
            await selectReferenceImagesFromHistory(settings.referenceImageCount);
        }
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
        await new Promise(r => setTimeout(r, 1500)); // 1000 -> 1500

        // 事前に現在の画像数をカウント
        const initialImgCount = document.querySelectorAll('img').length;
        console.log(`Flow Auto Clicker: Initial image count: ${initialImgCount}`);

        console.log("Flow Auto Clicker: Clicking 'Create' button (Attempt 1)...");
        createBtn.click();

        // 自動補完メニューなどを閉じるためのクリックになる可能性があるため、少し待って再クリック
        await new Promise(r => setTimeout(r, 1500)); // 1000 -> 1500

        console.log("Flow Auto Clicker: Clicking 'Create' button (Attempt 2)...");
        createBtn.click();

        // ---------------------------------------------------------
        // 時間経過による生成開始判定 (Time-based Fallback)
        // ---------------------------------------------------------
        console.log("Flow Auto Clicker: Verifying generation start...");
        let generationStarted = false;

        // 15秒間チェック (1秒おき) - UI変化も監視して誤検知を防ぐ
        for (let i = 0; i < 15; i++) {
            await new Promise(r => setTimeout(r, 1000));

            // 1. 画像数が増えているかチェック (既存)
            const currentCount = document.querySelectorAll('img').length;
            if (currentCount > initialImgCount) {
                console.log("Flow Auto Clicker: Generation started (New image detected)!");
                generationStarted = true;
                break;
            }

            // 2. エラーメッセージチェック (既存・重要)
            if (document.body.innerText.includes("1日あたりの上限")) {
                console.warn("Flow Auto Clicker: Limit error detected via text check.");
                generationStarted = false; // エラーなのでfalseのままbreakし、フォールバックへ
                break;
            }

            // 3. UI状態の変化をチェック (生成中を示す要素の出現)
            // - Stopボタン (生成中止ボタン) の出現: <button><i>stop</i></button>
            const stopBtn = document.evaluate("//button[.//i[contains(text(), 'stop')]]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            if (stopBtn) {
                console.log("Flow Auto Clicker: Generation started (Stop button detected)!");
                generationStarted = true;
                break;
            }

            // - プログレスバーの出現
            const progressBar = document.querySelector('[role="progressbar"]');
            if (progressBar) {
                console.log("Flow Auto Clicker: Generation started (Progress bar detected)!");
                generationStarted = true;
                break;
            }

            // - 元の「作成」ボタンが disabled になっているか
            //   (DOMが書き換わっている可能性もあるので、再取得を試みる)
            const arrowBtn = document.evaluate("//button[.//i[contains(text(), 'arrow_forward')]]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            if (arrowBtn && arrowBtn.disabled) {
                console.log("Flow Auto Clicker: Generation started (Create button disabled)!");
                generationStarted = true;
                break;
            }

            // 4. ダイアログ検出 (既存ロジックの改善)
            const cropBtn = findElement("//button[contains(., '切り抜きして保存')]", true);
            if (cropBtn && cropBtn.offsetParent !== null) {
                console.log("Flow Auto Clicker: Crop dialog detected. Skipping model switch fallback.");
                generationStarted = true; // フォールバック回避
                break;
            }
        }

        if (!generationStarted) {
            console.warn("Flow Auto Clicker: Generation did not start within timeout. Switching to Nano Banana...");

            // フォールバック: Nano Banana を選択 (枚数も1枚に設定)
            // ここで少し待ってから切り替え開始
            await new Promise(r => setTimeout(r, 1000));
            const switched = await configureSettings('Nano Banana', 1);

            if (switched) {
                console.log("Flow Auto Clicker: Switched to Nano Banana. Re-inputting text and retrying creation...");

                // 追加: フォールバック時にも参照画像を再選択
                if (settings.useReferenceImage) {
                    await selectReferenceImagesFromHistory(settings.referenceImageCount);
                }

                // モデル切り替え後にテキストが消えるため再入力
                const textarea = await waitForElement("#PINHOLE_TEXT_AREA_ELEMENT_ID", false);
                textarea.focus();
                textarea.value = PROMPT_TEXT;
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
                textarea.dispatchEvent(new Event('change', { bubbles: true }));
                await new Promise(r => setTimeout(r, 2000)); // 500 -> 2000 (遅いPC対策)

                // 少し待ってから作成ボタンを再クリック
                await new Promise(r => setTimeout(r, 3000)); // 1000 -> 3000 (十分待つ)
                createBtn.click();
                await new Promise(r => setTimeout(r, 3000)); // 1000 -> 3000 (再クリックもゆっくり)
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

        console.log("Flow Auto Clicker: Closing tab check...");
        if (settings.autoCloseTab) {
            console.log("Flow Auto Clicker: Auto-close enabled. Closing tab...");
            chrome.runtime.sendMessage({ action: "close_tab" });
        } else {
            console.log("Flow Auto Clicker: Auto-close disabled. Keeping tab open.");
        }

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
