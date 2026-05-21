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
  --exclude='docker-compose.yml' \
  *

echo "=== 2/4 上传到服务器 ==="
scp "$ARCHIVE" "$SERVER:$REMOTE_DIR/"

echo "=== 3/4 远程构建双镜像 ==="
ssh "$SERVER" << REMOTE
cd /opt/app
rm -rf chuangshizhe_build
mkdir chuangshizhe_build
tar -xzf copilot.tar.gz -C chuangshizhe_build/
cd chuangshizhe_build

# 构建 IP 内容工作台镜像
echo "--- 构建 IP 内容工作台镜像 ---"
docker build -t copilot-ip:\$VERSION -f Dockerfile .
docker tag copilot-ip:\$VERSION copilot-ip:latest

# 构建 启明盒子镜像
echo "--- 构建 启明盒子镜像 ---"
docker build -t copilot-edu:\$VERSION -f Dockerfile.edu .
docker tag copilot-edu:\$VERSION copilot-edu:latest

echo "双镜像构建完成"
REMOTE

echo "=== 4/4 启动双容器 ==="
ssh "$SERVER" << 'REMOTE'
# === IP 内容工作台 ===
docker stop copilot-ip 2>/dev/null || true
docker rm copilot-ip 2>/dev/null || true
docker run -d \
  --name copilot-ip \
  --restart always \
  --network host \
  -e DATABASE_URL="postgresql://chuangshizhe_user:Csj2026Secure%21@127.0.0.1:5432/chuangshizhe" \
  -e ALIYUN_API_KEY="sk-sp-1698373d17b74e1bab3d7bccc171f556" \
  -e NODE_ENV=production \
  copilot-ip:latest

# === 启明盒子 ===
docker stop copilot-edu 2>/dev/null || true
docker rm copilot-edu 2>/dev/null || true
docker run -d \
  --name copilot-edu \
  --restart always \
  --network host \
  -e DATABASE_URL="postgresql://chuangshizhe_user:Csj2026Secure%21@127.0.0.1:5432/chuangshizhe" \
  -e ALIYUN_API_KEY="sk-sp-1698373d17b74e1bab3d7bccc171f556" \
  -e NODE_ENV=production \
  copilot-edu:latest

echo "双容器已启动"
REMOTE

echo "=== 部署完成！版本: $VERSION ==="
echo "IP 内容工作台: http://111.228.45.216:3000/home"
echo "启明盒子:      http://111.228.45.216:3001"
echo ""
echo "查看日志:"
echo "  IP工作台: ssh root@111.228.45.216 'docker logs -f copilot-ip'"
echo "  启明盒子: ssh root@111.228.45.216 'docker logs -f copilot-edu'"
echo "回滚:       bash rollback.sh"
