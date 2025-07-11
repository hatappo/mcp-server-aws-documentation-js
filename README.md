# AWS Documentation MCP Server (TypeScript)

このプロジェクトは、AWS公式ドキュメントにアクセスするためのMCP（Model Context Protocol）サーバーのTypeScript実装です。

元になっている Python 実装は https://github.com/awslabs/mcp/tree/main/src/aws-documentation-mcp-server です。

## 概要

AWS Documentation MCP Serverは、LLMがAWS公式ドキュメントから情報を取得できるようにするMCPサーバーです。以下の機能を提供します：

- **read_documentation**: AWS ドキュメントページをMarkdown形式で取得
- **search_documentation**: AWS ドキュメント全体を検索
- **recommend**: 特定のドキュメントページに関連するコンテンツを推奨

## 技術スタック

- **Node.js**: 24.3.0以上
- **TypeScript**: 5.8.3
- **MCP SDK**: @modelcontextprotocol/sdk
- **HTML処理**: cheerio
- **Markdown変換**: turndown
- **テスト**: Vitest
- **リンター/フォーマッター**: Biome

## インストール

```bash
npm install
```

## 使用方法

### 開発モード

```bash
# TypeScriptをビルド
npm run build

# サーバーを起動
npm run start

# 開発用（ファイル変更時に自動再起動）
npm run dev
```

### 環境変数

- `AWS_DOCUMENTATION_PARTITION`: AWSパーティション（デフォルト: `aws`）
  - `aws`: グローバルリージョン
  - `aws-cn`: 中国リージョン（未実装）

## MCPツール

### 1. read_documentation

AWS ドキュメントページをMarkdown形式で取得します。

**パラメータ:**
- `url` (必須): 読み取るAWS ドキュメントページのURL
- `max_length` (オプション): 最大文字数（デフォルト: 5000）
- `start_index` (オプション): 読み取り開始位置（デフォルト: 0）

**制約:**
- URLは `https://docs.aws.amazon.com/` で始まる必要があります
- URLは `.html` で終わる必要があります

### 2. search_documentation

AWS公式検索APIを使用してドキュメントを検索します。

**パラメータ:**
- `search_phrase` (必須): 検索フレーズ
- `limit` (オプション): 最大結果数（デフォルト: 10、最大: 50）

**戻り値:**
```json
[
  {
    "rank_order": 1,
    "url": "https://docs.aws.amazon.com/...",
    "title": "ドキュメントタイトル",
    "context": "検索結果のコンテキスト"
  }
]
```

### 3. recommend

特定のドキュメントページに関連するコンテンツを推奨します。

**パラメータ:**
- `url` (必須): 推奨を取得するAWS ドキュメントページのURL

**戻り値:**
```json
[
  {
    "url": "https://docs.aws.amazon.com/...",
    "title": "推奨コンテンツのタイトル",
    "context": "推奨理由やコンテキスト"
  }
]
```

## 開発

### プロジェクト構造

```
src/
├── index.ts          # エントリーポイント
├── models.ts         # 型定義
├── server-aws.ts     # AWS用MCPサーバー実装
├── server-utils.ts   # 共通ユーティリティ
└── util.ts           # HTML処理等のユーティリティ
```

### テスト

```bash
# 全テストを実行
npm run test

# テストを監視モードで実行
npm run test:watch
```

### コード品質

```bash
# リンターチェック
npm run lint

# リンターによる自動修正
npm run lint:fix

# フォーマッター
npm run format

# 型チェック
npm run typecheck
```

## 実装の詳細

### HTMLからMarkdownへの変換

1. **コンテンツ抽出**: 複数のCSSセレクタを使用してメインコンテンツを特定
2. **クリーンアップ**: 不要な要素（ナビゲーション、フッター等）を除去
3. **Markdown変換**: turndownを使用してHTMLをMarkdownに変換

### セッション管理

- 全てのAPI呼び出しで一貫したセッションIDを使用
- UUIDベースのセッションIDをヘッダーに設定

### エラーハンドリング

- HTTPエラーは適切なエラーメッセージと共に処理
- HTML解析エラーも捕捉して処理
- ユーザーフレンドリーなエラーメッセージを返す

## 依存関係

### 実行時依存関係

- `@modelcontextprotocol/sdk`: MCP SDK
- `cheerio`: HTMLパーシング
- `turndown`: HTMLからMarkdownへの変換
- `uuid`: セッションID生成
- `jsdom`: DOM操作

### 開発依存関係

- `@biomejs/biome`: リンター/フォーマッター
- `typescript`: TypeScriptコンパイラー
- `vitest`: テストフレームワーク
- `@types/*`: 型定義

## 関連リンク

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [AWS Documentation](https://docs.aws.amazon.com/)
- [Python版実装](../mcp/src/aws-documentation-mcp-server/)