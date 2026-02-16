console.log("Flow Auto Login: Script loaded");

function clickFirstAccount() {
    // アカウントリストの要素を探す (Googleのログイン画面の構造に依存)
    // 一般的なアカウント選択リストのアイテム: role="link" かつ data-email 属性などを持つ
    // または、リスト構造 ul > li > div[role="button"]

    // 汎用的なセレクタ（変更に弱い可能性があるが、構造から推測）
    // 以前の経験や一般的な構造から、[data-identifier] 属性を持つ要素がアカウント行であることが多い
    const accountRows = document.querySelectorAll('div[data-identifier]');

    if (accountRows.length > 0) {
        console.log("Flow Auto Login: Account found, clicking first one...", accountRows[0]);
        accountRows[0].click();
        return true;
    }

    // 別のパターン: リストアイテム (li) の中のクリック可能な要素
    const listItems = document.querySelectorAll('li div[role="link"]');
    if (listItems.length > 0) {
        console.log("Flow Auto Login: Account list item found, clicking...", listItems[0]);
        listItems[0].click();
        return true;
    }

    return false;
}

// 読み込み待ち
setTimeout(() => {
    if (!clickFirstAccount()) {
        console.log("Flow Auto Login: No account list found. Trying mutation observer...");

        const observer = new MutationObserver(() => {
            if (clickFirstAccount()) {
                observer.disconnect();
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        // タイムアウト
        setTimeout(() => observer.disconnect(), 10000);
    }
}, 1000);
