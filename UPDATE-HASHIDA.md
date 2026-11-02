# hashida版への更新手順

現在GitHubにあるデモに、以下の4項目を反映します。ZIPそのものをアップロードするのではなく、展開して中身を使ってください。

1. `public/app.js` を上書き。
2. `public/index.html` を上書き。
3. `public/hashida-loader.js` を新規追加。
4. `public/models/` フォルダーを新規追加（hashida.glbとmanifest.json）。

デモをカスタマイズしていない場合は、リポジトリの `public` 全体を今回のものに更新しても構いません。GitHubで「Add file → Upload files」を開き、該当ファイル・フォルダーをドラッグしてCommitします。ファイルの位置が `public/public/...` にならないようにしてください。

Cloudflare Pagesの設定は、従来どおり出力ディレクトリ `public`、ビルドコマンド `exit 0` です。Commit後の自動デプロイが成功したら、スマホで公開URLを開き直します。古いキャラクターが残る場合はページを再読み込みしてください。

「PALM PAL / HASHIDA · v2」が出れば新しい版です。「3D表示を確認」でhashidaが表示されることを確認し、「カメラを開始」を押して実際の手で追従を確認してください。

今回のモデルにはアニメーションがないため、立ち姿で移動・拡大縮小・画面内の傾きに追従します。元のGLBを改変せず、表示時に高さと足元を調整します。

表示サイズを変える場合は `public/app.js` の `p.width*0.65`（手の幅に対する倍率）を変更できます。大きくするなら `0.8`、小さくするなら `0.5` が目安です。

ローカルPCで確認する場合は、このフォルダーで `npm start` を実行し、表示されたlocalhostのURLを開いてください。npm installは不要です。全体の公開・利用手順はREADME.mdを参照してください。

この成果物はローカルで作成・検証したものです。GitHubやCloudflare上のファイルは変更していません。
