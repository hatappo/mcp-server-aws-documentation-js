# 01-DOC-translate-python-to-ts

## Python実装の解析

### プロジェクト概要
AWS Documentation MCP Serverは、AWS公式ドキュメントへのアクセスを提供するMCP (Model Context Protocol) サーバーです。Python実装はFastMCPフレームワークを使用して構築されています。

### ディレクトリ構造

```
aws-documentation-mcp-server/
├── awslabs/
│   ├── __init__.py
│   └── aws_documentation_mcp_server/
│       ├── __init__.py          # バージョン情報
│       ├── models.py            # データモデル定義
│       ├── server.py            # メインエントリーポイント
│       ├── server_aws.py        # AWS用サーバー実装
│       ├── server_aws_cn.py     # AWS中国リージョン用サーバー実装
│       ├── server_utils.py      # 共通ユーティリティ
│       └── util.py              # HTMLパース等のユーティリティ
├── tests/                       # テストスイート
├── pyproject.toml              # プロジェクト設定とメタデータ
└── README.md                   # ドキュメント
```

### 主要コンポーネント

#### 1. エントリーポイント (server.py)
- 環境変数`AWS_DOCUMENTATION_PARTITION`に基づいてサーバー実装を選択
- デフォルトは`aws`（グローバル）、`aws-cn`（中国リージョン）もサポート
- ログレベルは環境変数`FASTMCP_LOG_LEVEL`で制御

#### 2. サーバー実装 (server_aws.py, server_aws_cn.py)
FastMCPフレームワークを使用してMCPサーバーを実装し、以下の3つのツールを提供：

1. **read_documentation**
   - AWS ドキュメントページをマークダウン形式で取得
   - ページネーション機能をサポート
   - パラメータ：
     - `url`: AWS ドキュメントページのURL (必須)
     - `start_index`: 読み取り開始位置 (デフォルト: 0)
     - `max_length`: 最大文字数 (デフォルト: 300,000)

2. **search_documentation**
   - AWS ドキュメント全体を検索
   - AWS公式検索APIを使用
   - パラメータ：
     - `phrase`: 検索フレーズ (必須)
     - `max_results`: 最大結果数 (デフォルト: 10、最大: 50)

3. **recommend**
   - 特定のドキュメントページに関連するコンテンツを推奨
   - 4種類の推奨タイプを提供
   - パラメータ：
     - `url`: AWS ドキュメントページのURL (必須)
     - `recommendation_type`: 推奨タイプ (highly_rated, new, similar, journey)

#### 3. データモデル (models.py)
Pydanticを使用した型安全なデータモデル：

```python
class SearchResult(BaseModel):
    rank: int
    url: str
    title: str
    context: str

class RecommendationResult(BaseModel):
    title: str
    url: str
    updated: Optional[str] = None
```

#### 4. ユーティリティ関数

**server_utils.py**
- `generate_session_id()`: UUID形式のセッションIDを生成
- `create_httpx_client()`: カスタムヘッダー付きHTTPクライアントを作成

**util.py**
- `parse_and_convert_to_markdown()`: HTMLをMarkdownに変換
  - BeautifulSoup4でHTMLを解析
  - 不要な要素（nav, footer, script等）を削除
  - markdownifyでMarkdownに変換
- `paginate_content()`: 大きなコンテンツを分割

### 依存関係

```toml
dependencies = [
    "markdownify>=1.1.0",      # HTML→Markdown変換
    "mcp[cli]>=1.6.0",         # MCPサーバーフレームワーク
    "pydantic>=2.10.6",        # データバリデーション
    "httpx>=0.27.0",           # 非同期HTTPクライアント
    "loguru>=0.7.0",           # ロギング
    "beautifulsoup4>=4.12.0",  # HTMLパーシング
]
```

### API仕様

#### 1. AWS Search API
- エンドポイント: `https://proxy.search.docs.aws.amazon.com/search`
- メソッド: GET
- パラメータ:
  - `query`: 検索フレーズ
  - `lang`: 言語コード (デフォルト: en)
  - `from`: 開始位置
  - `size`: 結果数

#### 2. AWS Recommendations API
- エンドポイント: `https://contentrecs-api.docs.aws.amazon.com/v1/recommendations`
- メソッド: GET
- パラメータ:
  - `url`: ドキュメントURL
  - `type`: 推奨タイプ

### セッション管理
- 全てのAPI呼び出しで一貫したセッションIDを使用
- ヘッダーに`X-MCP-Session-Id`として設定
- セッションIDはUUID形式

### エラーハンドリング
- HTTPエラーは適切なエラーメッセージと共に処理
- HTML解析エラーも捕捉して処理
- ユーザーフレンドリーなエラーメッセージを返す

## TypeScript実装への変換方針

### 1. プロジェクト構造
```
mcp-server-aws-documentation-js/
├── src/
│   ├── index.ts              # エントリーポイント
│   ├── models.ts             # 型定義
│   ├── server.ts             # MCPサーバー実装
│   ├── server-aws.ts         # AWS用サーバー実装
│   ├── server-aws-cn.ts      # AWS中国リージョン用サーバー実装
│   ├── server-utils.ts       # 共通ユーティリティ
│   └── util.ts               # HTMLパース等のユーティリティ
├── tests/                    # Vitestテスト
├── package.json             # プロジェクト設定
├── tsconfig.json            # TypeScript設定
└── biome.json               # Biome設定
```

### 2. 主要な変換ポイント

#### Python → TypeScript マッピング
- `FastMCP` → `@modelcontextprotocol/sdk`のServer実装
- `pydantic.BaseModel` → TypeScriptインターフェース
- `httpx` → 標準`fetch` API
- `beautifulsoup4` → `cheerio`または`jsdom`
- `markdownify` → `turndown`
- `loguru` → 標準`console`またはシンプルなロガー

#### 非同期処理
- Python: `async def` → TypeScript: `async function`
- Python: `await` → TypeScript: `await`

#### 型定義
- Pythonの型ヒントをTypeScriptの型システムに変換
- Pydanticモデルをインターフェースに変換
- オプショナル型の適切な処理

### 3. 実装上の注意点

#### MCPサーバー実装
- `@modelcontextprotocol/sdk`の最新バージョンを使用
- Tool定義とハンドラーの適切な実装
- エラーハンドリングの一貫性

#### HTTP通信
- `fetch` APIを使用した非同期通信
- カスタムヘッダーの設定
- エラーレスポンスの適切な処理

#### HTML処理
- `cheerio`または`jsdom`でのDOM操作
- `turndown`でのMarkdown変換
- 不要要素の除去ロジックの再現

#### 環境変数
- `process.env`での環境変数アクセス
- 型安全な環境変数の処理

### 4. テスト戦略
- Vitestを使用したユニットテスト
- モック化されたHTTPレスポンス
- エッジケースのテスト
- 型のテスト

### 5. 開発環境
- Node.js（最新版）をVoltaで管理
- TypeScriptの直接実行（`node`コマンド）
- Biomeでのコード品質管理
- 継続的インテグレーション対応