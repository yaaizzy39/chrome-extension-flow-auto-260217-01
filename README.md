# Flow Auto Clicker - 使い方

このChrome拡張機能は、Google Labs Flowのページを開き、「新しいプロジェクト」ボタンを自動的にクリックします。

## インストール方法

1. Chromeブラウザを開き、アドレスバーに `chrome://extensions/` と入力して移動します。
2. 右上の「デベロッパー モード」スイッチをオンにします。
3. 左上の「パッケージ化されていない拡張機能を読み込む」ボタンをクリックします。
4. このプロジェクトのフォルダ (`h:\yaa\programming\Antigravity\chrome-extension-flow-auto-260216-01`) を選択します。

## 使い方

1. ブラウザのツールバーにある拡張機能アイコン（パズルのピースのようなアイコン）をクリックし、「Flow Auto Clicker」をピン留めしておくと便利です。
2. 「Flow Auto Clicker」のアイコンをクリックします。
3. 新しいタブで `https://labs.google/fx/ja/tools/flow` が開きます。
4. ページ読み込み完了後、自動的に「新しいプロジェクト」ボタンがクリックされます。

## 注意事項

- Google Labs Flowのページ構造（HTML/CSS）が変更された場合、正常に動作しなくなる可能性があります。その際は `content.js` の修正が必要です。
