#!/usr/bin/env bash
# deploy.sh - 双容器部署（IP工作台 + 启明盒子）
set -e

SERVER="root@111.228.45.216"
REMOTE_DIR="/opt/app"
ARCHIVE="copilot.tar.gz"

VERSION="v$(git log -1 --format=%h)-$(date +%m%d%H%M)"

echo "=== 版本: $VERSION ==="

echo "=== 1/4 打包代码 ==="
rm -f "$ARCHIVE"
tar -czf "$ARCHIVE" --exclude='node_modules' --exclude='.next' --exclude='.git' \
  --exclude='deploy.sh' --exclude='rollback.sh' \
  --exclude='Dockerfile.edu' --exclude='docker-compose.yml' \
  *

echo "=== 2/4 上传到服务器 ==="
scp "$ARCHIVE" "$SERVER:$REMOTE_DIR/"

echo "=== 3/4 远程构建镜像 ==="
ssh "$SERVER" << REMOTE
cd /opt/app
rm -rf chuangshizhe_build
mkdir chuangshizhe_build
tar -xzf copilot.tar.gz -C chuangshizhe_build/
cd chuangshizhe_build
docker build -t chuangshizhe-copilot:\$VERSION .
docker tag chuangshizhe-copilot:\$VERSION chuangshizhe-copilot:latest
echo "镜像构建完成: chuangshizhe-copilot:\$VERSION"
REMOTE

echo "=== 4/4 启动双服务容器 ==="
ssh "$SERVER" << 'REMOTE'
docker stop chuangshizhe-copilot 2>/dev/null || true
docker rm chuangshizhe-copilot 2>/dev/null || true

docker run -d \
  --name chuangshizhe-copilot \
  --restart always \
  --network host \
  -e DATABASE_URL="postgresql://chuangshizhe_user:Csj2026Secure%21@127.0.0.1:5432/chuangshizhe" \
  -e ALIYUN_API_KEY="sk-sp-1698373d17b74e1bab3d7bccc171f556" \
  -e NODE_ENV=production \
  chuangshizhe-copilot:latest

echo "双服务容器已启动"
REMOTE

echo "=== 部署完成！版本: $VERSION ==="
echo "IP 内容工作台: http://111.228.45.216:3000/home"
echo "启明盒子:      http://111.228.45.216:3001"
echo ""
echo "查看日志: ssh root@111.228.45.216 'docker logs -f chuangshizhe-copilot'"
echo "回滚:       bash rollback.sh"
