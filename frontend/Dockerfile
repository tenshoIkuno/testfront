# 1. ビルド用ステージ
FROM node:22-slim AS builder
WORKDIR /app
# 依存関係のインストール
COPY package.json package-lock.json ./
RUN npm ci
# プロジェクトのコピー
COPY . .
# ビルド
RUN npm run build

# 2. 軽量なWebサーバーで公開
FROM nginx:alpine
# 実行環境に必要なものだけをコピー
COPY --from=builder /app/dist /usr/share/nginx/html
# ポート公開
EXPOSE 80
# 起動
CMD ["nginx", "-g", "daemon off;"]