#!/usr/bin/env bash
# rollback.sh - 回滚到上一个部署版本
set -e

SERVER="root@111.228.45.216"

echo "=== 检查服务器上可用的镜像版本 ==="
IMAGES=$(ssh "$SERVER" "docker images chuangshizhe-copilot --format '{{.Repository}}:{{.Tag}} {{.CreatedAt}}' | grep -v 'latest' | sort -k2")

if [ -z "$IMAGES" ]; then
  echo "错误：没有找到可回滚的旧版本镜像"
  exit 1
fi

echo "可用版本："
echo "$IMAGES"
echo ""

# 获取最新的一个旧版本
PREV_IMAGE=$(echo "$IMAGES" | head -1 | awk '{print $1}')

echo "=== 回滚到: $PREV_IMAGE ==="

ssh "$SERVER" << REMOTE
# 停止当前容器，保留为 old
docker stop chuangshizhe-copilot 2>/dev/null || true
docker rename chuangshizhe-copilot chuangshizhe-copilot-failed 2>/dev/null || true

# 启动旧版本
docker run -d \
  --name chuangshizhe-copilot \
  --restart always \
  --network host \
  -e DATABASE_URL="postgresql://chuangshizhe_user:Csj2026Secure%21@127.0.0.1:5432/chuangshizhe" \
  -e ALIYUN_API_KEY="sk-sp-1698373d17b74e1bab3d7bccc171f556" \
  -e NODE_ENV=production \
  $PREV_IMAGE

echo "已回滚到版本: $PREV_IMAGE"
REMOTE

echo "=== 回滚完成！访问 http://111.228.45.216:3000 ==="
echo ""
echo "清理旧容器: ssh root@111.228.45.216 'docker rm chuangshizhe-copilot-old chuangshizhe-copilot-failed 2>/dev/null'"
