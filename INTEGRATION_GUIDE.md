# リファクタリング統合ガイド

## 完了した作業

### モジュール構造の完成

すべてのモジュールが作成され、統合ファイル`TagRugby-core-v2.js`が完成しました。

## ファイル構造

```
assets/js/
├── config/
│   └── GameConfig.js          # 設定と定数
├── utils/
│   ├── math.js                # 数学関数
│   ├── array.js                # 配列操作
│   ├── validation.js          # 検証関数
│   └── gameUtils.js            # ゲーム固有のユーティリティ
├── game/
│   ├── GameState.js            # ゲーム状態管理
│   ├── GameController.js       # ゲーム制御クラス
│   ├── ActionValidator.js      # アクション検証
│   ├── TurnManager.js          # ターン管理
│   ├── GameRules.js            # ゲームルール
│   └── AIParameterHelper.js    # AI評価用パラメータ取得
├── rendering/
│   ├── CanvasRenderer.js       # キャンバス描画
│   ├── CanvasResizer.js        # キャンバスサイズ調整
│   └── UIRefresher.js          # UIパラメータ更新
├── ai/
│   ├── AIRegistry.js           # AI関数の登録・管理
│   ├── AISandbox.js            # AIコードの安全な実行環境
│   └── AISamples.js            # サンプルAI実装
├── state/
│   └── AppState.js             # アプリケーション状態管理
├── integration/
│   ├── IntegrationHelper.js    # 統合ヘルパー
│   └── GameInitialization.js   # ゲーム初期化
├── compat/
│   └── GlobalCompat.js         # 互換性ラッパー
├── TagRugby-core.js            # 既存ファイル（変更なし）
├── TagRugby-core-refactored.js # リファクタリング後のエントリーポイント
└── TagRugby-core-v2.js         # 完全な統合ファイル（推奨）
```

## 使用方法

### 方法1: ES6モジュールを使用（推奨）

`index.html`を更新してES6モジュールを使用：

```html
<!-- 既存の行を置き換え -->
<script type="module" src="assets/js/TagRugby-core-v2.js"></script>
```

**注意**: この方法では、他のスクリプトもES6モジュール対応が必要な場合があります。

### 方法2: バンドラーを使用

WebpackやRollupなどのバンドラーを使用して、ES6モジュールをブラウザ対応形式に変換：

```bash
# 例: Rollupを使用
npm install rollup --save-dev
rollup -i assets/js/TagRugby-core-v2.js -o assets/js/TagRugby-core-bundled.js -f iife
```

その後、`index.html`でバンドルされたファイルを読み込み：

```html
<script src="assets/js/TagRugby-core-bundled.js"></script>
```

### 方法3: 段階的な統合

既存の`TagRugby-core.js`を段階的に新しいモジュールを使用するように更新します。詳細は`IntegrationHelper.js`を参照してください。

## 主な改善点

1. **モジュール分割**: 1640行超のファイルを論理的なモジュールに分割
2. **コード品質**: 関数名の統一、型安全性の向上
3. **セキュリティ**: `eval()`を`Function`コンストラクタに置き換え（準備完了）
4. **保守性**: 各モジュールが単一の責任を持つ
5. **拡張性**: 新しい機能を追加しやすい構造

## 既存コードとの互換性

- すべてのグローバル変数と関数は`window`オブジェクトに公開
- `Array.prototype.copy`メソッドを維持
- `rugby_AI`配列との互換性を保つ
- 既存のAIインターフェース（`rugby_AI.AI#`）を維持

## 次のステップ

1. **テスト**: 新しいモジュール構造を使用して動作確認
2. **統合**: `index.html`を更新して新しいファイルを使用
3. **最適化**: 必要に応じてバンドラーを使用して最適化

## トラブルシューティング

### ES6モジュールが読み込めない場合

- ブラウザがES6モジュールに対応しているか確認
- サーバーがCORSを許可しているか確認
- ファイルパスが正しいか確認

### 既存のコードと互換性がない場合

- `IntegrationHelper.js`を使用してグローバル変数を確認
- 既存のグローバル関数がすべて`window`オブジェクトに公開されているか確認

