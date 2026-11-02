# Palm Pal — hashida GLB版・手のひら追従 WebAR

ご提供の hashida.glb に差し替えた、ビルド不要のデモです。既存デモからの更新は UPDATE-HASHIDA.md を参照してください。
MediaPipe Hand Landmarker 0.10.21 + Three.js 0.170.0 を使用します。

## すぐ使う

1. ZIPを展開します。
2. 新しいGitHubリポジトリへ、このフォルダーの**中身**をアップロードします。
3. Cloudflare Pagesでそのリポジトリを接続します。出力ディレクトリは `public` です。
4. 発行されたHTTPSのURLをスマホのSafari / Chromeで開きます。
5. 「カメラを開始」を押し、カメラを許可します。

ライブラリ・WASM・認識モデルは `public/vendor` に同梱済みです。閲覧時にCDNへアクセスしません。認識エンジン・ライブラリ・GLBを合わせて約35MBを同梱しており、通信速度によって時間がかかります。全ファイルが毎回同時に必要なわけではありません。

## GitHubへの配置（ブラウザーで行う方法）

1. GitHubにログインし、右上の「+」→「New repository」。例として `palm-pal-ar` を作成します。Public / Privateは任意です。
2. リポジトリの「uploading an existing file」、または「Add file → Upload files」を開きます。
3. 展開した `hand-ar-demo` の中から `public`、`scripts`、`package.json`、`README.md`、`VALIDATION.md`、`THIRD_PARTY_NOTICES.md` をドラッグしてアップロードします。
4. 「Commit changes」で `main` に保存します。ZIPをそのまま置くだけでは動きません。
5. リポジトリ直下に `public/index.html` があり、`public/vendor/hand_landmarker.task` と `public/vendor/wasm/` 内の4ファイルがあることを確認します。

フォルダーごとアップロードできないブラウザーでは、GitHub Desktopで新しいリポジトリを作り、このフォルダーの中身をコピーしてCommit → Publish repositoryしてください。

## Cloudflare Pagesへの公開

Cloudflareの画面表示は更新される場合があります。**WorkersのデプロイではなくPagesのGit連携**を選択してください。

1. Cloudflareにログイン →「Workers & Pages」→「Create application」→「Pages」→「Import an existing Git repository」。
2. GitHubを連携し、作成したリポジトリへのアクセスを許可します。組織所有のリポジトリでは管理者の許可が必要な場合があります。
3. 以下を設定します。

| 項目 | 設定 |
| --- | --- |
| Project name | `palm-pal-ar` など任意 |
| Production branch | `main` |
| Framework preset | `None` |
| Build command | `exit 0` |
| Build output directory | `public` |
| Root directory | 未指定（リポジトリ直下） |
| 環境変数 | 不要 |

4. 「Save and Deploy」を実行します。
5. デプロイ成功後、表示された `https://プロジェクト名.pages.dev/` を開きます。
6. まず「3D表示を確認」でキャラクターが出ることを確認します。
7. 「診断ログ・読み込めないとき」を開き、「認識エンジンを検査」を押します。「検査OK」が出ればライブラリ・WASM・モデルが読み込めています。
8. スマホでカメラを起動し、実際の手の追従を確認します。

GitHubへ変更を保存するとPagesが再デプロイします。既存のBeauty ARプロジェクトとは別のPagesプロジェクトとして作成できます。

## スマホでの利用

- iPhone / iPad: SafariでHTTPS URLを直接開きます。Android: Chromeで開きます。LINEなどのアプリ内ブラウザーは避けてください。
- 背面カメラが初期選択です。自撮りする場合は「前面」を選択します。前面では左右反転を自動でオンにし、手動でも変更できます。
- 明るい場所で、開いた手のひら全体が画面に入るようにします。背景は単純なものがおすすめです。
- キャラクターの足元が手の中心に重なり、左右・上下の移動、手の大きさ、画面内の傾きに追従します。
- 「認識点を表示」で21点を表示できます。手を外すとキャラクターは消えます。
- カメラを変えるときは「停止」→選択→「カメラを開始」。別のアプリに切り替えると停止するので、戻ったら開始し直してください。
- 映像と認識点はブラウザー内で処理され、アップロード・保存されません。マイクは使いません。サイト自体の配信には通常のHTTPリクエストが発生します。

## 止まったように見える場合

| 画面の表示・症状 | 対処 |
| --- | --- |
| 起動エラー：app.jsを読み込めません | `public` の中身が配信されているか、出力ディレクトリと通信を確認。再読み込み。 |
| Three.js / 認識ライブラリの読み込み失敗 | `vendor` の不足、404、通信遮断、古い配信キャッシュを確認。 |
| WASM / モデルの初期化エラー | `.wasm` と `.task` を省略せず配置。Pagesへのアップロードが完了しているか確認。 |
| タイムアウト | 通信が安定した環境で再読み込み。JS/WASM設定20秒、モデル45秒、カメラ権限30秒、動画再生15秒でエラー表示します。 |
| カメラが許可されていません | Safari / Chromeのサイト権限、端末設定のカメラ権限を確認し、再試行。 |
| カメラを開けません | 他のカメラアプリを閉じ、Safari / Chromeで直接開く。 |
| カメラにはHTTPSが必要 | `file://`、スマホからのLAN内HTTPは使わず、PagesのHTTPS URLを開く。 |
| 手を探しています | まだ手が認識されていません。明るくし、手全体を映す。認識点をオンにする。 |
| 3Dだけ出て手には追従しない | 「3D表示を確認」は表示確認用です。「カメラを開始」を押す。 |
| 以前のBeauty ARが出る | 新しいPagesプロジェクトのURL、対象リポジトリ、最新デプロイを確認。 |

エラー後は「カメラを開始」で再試行できます。モデル初期化や3Dコンテキストのエラーは「ページを再読み込み」を推奨します。タイムアウトしてからカメラ許可が到着した場合は、そのカメラを自動停止します。

ブラウザー自体が停止・クラッシュするケースや、同期WASM処理が端末を占有している最中は、JavaScriptのタイマーも動かず、画面更新できない場合があります。タブを閉じて再度開き、他のアプリを閉じてください。「どの端末でも絶対にフリーズしない」という保証ではありません。

## PCでのローカル確認（Node.jsを使用）

このREADMEとpackage.jsonがあるフォルダーで実行します。npm installは不要です。

```sh
npm start
```

表示された `http://127.0.0.1:8787` をPCのブラウザーで開きます。停止はターミナルでCtrl+C。これはPC内のURLなのでスマホからは開けません。

```sh
npm run check
```

構文と画面座標のテストを実行します。依存ファイルを再取得する場合のみ `npm run assets`（Node.js 20以降推奨、ネット接続が必要）を実行します。ダウンロード元とSHA-256は `public/vendor/manifest.json` に記録されます。

## 構成・実装範囲

- `public/index.html`: 画面とモジュール起動監視。
- `public/app.js`: 段階別の初期化、タイムアウト、カメラ、推論、GLB表示。
- `public/hashida-loader.js`: 提供された静止・非圧縮GLB用の読み込み処理。
- `public/models/hashida.glb`: ご提供のモデル。元ファイルを変更せず同梱。
- `public/geometry.js`: 手の認識点を表示領域に変換。動画とオーバーレイは同じcontain配置を使うので、縦横画面の余白があっても座標が揃います。
- `public/style.css`: スマホ対応画面。
- `public/vendor/`: 固定バージョンのライブラリ・WASM・モデル・ライセンス。
- `public/_headers`: Pages用のヘッダー。
- `scripts/`: ローカル確認と依存ファイル取得。

手首・人差し指・中指・薬指・小指の付け根（0, 5, 9, 13, 17番）の平均を足元にします。手の幅で大きさを変え、手首→中指の方向に合わせて画面内の傾きを変えます。揺れを抑える補間を入れています。認識は1本の手・CPU・最大約15回/秒を目安に実行します。推論はメインスレッドなので、低速端末では描画速度が落ちます。

これはカメラ映像上への簡易ARです。WebXR、実寸や距離の校正、実空間への固定、完全な手の3D姿勢推定、手の表裏の厳密判定、手による遮蔽には対応していません。手の甲にも反応します。キャラクターはテクスチャ内蔵の静止3Dモデルで、ご提供のGLBを public/models/hashida.glb から読み込みます。

## 公式資料

- MediaPipe Web: https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker/web_js
- Three.js: https://threejs.org/docs/
- Cloudflare静的HTML: https://developers.cloudflare.com/pages/framework-guides/deploy-anything/

検証結果と未確認項目は `VALIDATION.md` を参照してください。

## hashida版の対応範囲

このファイルにはアニメーションが含まれていないため、立ち姿のまま追従します。モデルの高さを2に正規化し、モデルの最下部を足元として自動配置します。GLBは41,198頂点・71,532三角形、内蔵JPEGテクスチャ3枚です。

新しい読み込み処理は、今回の単一メッシュ・静止・非圧縮・内蔵テクスチャのGLB用です。任意のGLB、Draco/Meshopt圧縮、スキン、アニメーション、glTF拡張には対応していません。別形式のモデルへ変更する場合はローダーの追加対応が必要です。未対応の機能は画面にエラーを表示します。追加のCDNアクセスはありません。
