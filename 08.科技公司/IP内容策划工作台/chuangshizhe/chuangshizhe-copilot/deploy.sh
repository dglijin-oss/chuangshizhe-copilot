#!/usr/bin/env bash
# deploy.sh - PM2 部署脚本 (无需 Docker)
set -e

SERVER="root@111.228.45.216"
REMOTE_DIR="/opt/chuangshizhe-copilot"
BUILD_DIR="/tmp/chuangshizhe_build"

VERSION="v$(git log -1 --format=%h)-$(date +%m%d%H%M)"

echo "=========================================="
echo "  创世者 Copilot - PM2 部署"
echo "  版本: $VERSION"
echo "  目标: $SERVER:$REMOTE_DIR"
echo "=========================================="
echo ""

# === 1/5 打包代码 ===
echo ">>> 1/5 打包代码"
ARCHIVE="copilot_deploy.tar.gz"
rm -f "$ARCHIVE"
git archive --format=tar HEAD | gzip > "$ARCHIVE"
echo "    $(du -h "$ARCHIVE" | cut -f1)"
echo ""

# === 2/5 上传 ===
echo ">>> 2/5 上传到服务器"
ssh "$SERVER" "mkdir -p $BUILD_DIR"
scp "$ARCHIVE" "$SERVER:$BUILD_DIR/code.tar.gz"
echo "    上传完成"
echo ""

# === 3/5 部署到目标目录 ===
echo ">>> 3/5 部署代码 (保留 .env 和 node_modules)"
ssh "$SERVER" << REMOTE
set -e

# 备份旧 .env 文件
if [ -f $REMOTE_DIR/.env ]; then
  cp $REMOTE_DIR/.env /tmp/deploy_env_backup.env
  echo "  已备份 .env"
fi

# 清理旧代码
cd $REMOTE_DIR
# 删除除了 .env, .env.production, node_modules 之外的所有文件/目录
find . -maxdepth 1 -not -name '.' \
  -not -name '.env' -not -name '.env.production' \
  -not -name 'node_modules' \
  -exec rm -rf {} +

# 解压新代码
tar -xzf $BUILD_DIR/code.tar.gz -C $REMOTE_DIR/

# 恢复 .env 文件
if [ -f /tmp/deploy_env_backup.env ]; then
  cp /tmp/deploy_env_backup.env $REMOTE_DIR/.env
  rm /tmp/deploy_env_backup.env
  echo "  已恢复 .env"
fi

# 清理上传的临时文件
rm -rf $BUILD_DIR

echo "  代码就绪"
REMOTE
echo ""

# === 4/5 安装依赖 + 构建 ===
echo ">>> 4/5 安装依赖 + 构建 (可能需要 3-5 分钟)"
ssh "$SERVER" << 'REMOTE'
set -e
cd /opt/chuangshizhe-copilot

echo "  [pnpm install]"
pnpm install --no-frozen-lockfile
echo "  依赖安装完成"

echo ""
echo "  [Prisma 生成]"
export SKIP_ENV_VALIDATION=1
cd packages/database
npx prisma generate --schema=schema-core.prisma 2>&1 | tail -1
npx prisma generate --schema=schema-ip.prisma 2>&1 | tail -1
npx prisma generate --schema=schema-xuanxue.prisma 2>&1 | tail -1
cd ../..

echo ""
echo "  [构建] 构建 ip-copilot + admin (webpack)"
# Build from root to resolve workspace package paths correctly
cd apps/ip-copilot && pnpm build --webpack 2>&1 | tail -5 && cd ../..
cd apps/admin && pnpm build --webpack 2>&1 | tail -5 && cd ../..

echo ""
echo "  [复制 Prisma 客户端到 standalone]"
# serverExternalPackages marks @chuangshizhe/database as external,
# so we need to copy the generated clients into standalone node_modules
STANDALONE="apps/ip-copilot/.next/standalone/node_modules/@chuangshizhe"
mkdir -p "$STANDALONE"
cp -r packages/database "$STANDALONE/database"
# Also need @prisma/adapter-pg for the standalone
ADAPTER_TARGET="apps/ip-copilot/.next/standalone/node_modules/@prisma"
mkdir -p "$ADAPTER_TARGET"
if [ -d "node_modules/.pnpm/@prisma+adapter-pg@7.8.0" ]; then
  cp -r node_modules/.pnpm/@prisma+adapter-pg@7.8.0/node_modules/@prisma/adapter-pg "$ADAPTER_TARGET/" 2>/dev/null || true
fi
if [ -d "node_modules/.pnpm/@prisma+driver-adapter-utils@7.8.0" ]; then
  cp -r node_modules/.pnpm/@prisma+driver-adapter-utils@7.8.0/node_modules/@prisma/driver-adapter-utils "$ADAPTER_TARGET/" 2>/dev/null || true
fi
echo "  Prisma 客户端已复制到 standalone"

echo ""
echo "  所有应用构建完成"
REMOTE
echo ""

# === 5/5 PM2 重启 ===
echo ">>> 5/5 PM2 重启"
ssh "$SERVER" << 'REMOTE'
set -e
cd /opt/chuangshizhe-copilot

mkdir -p /var/log/pm2

echo "  [停止旧进程]"
pm2 delete ip-copilot 2>/dev/null || true
pm2 delete admin 2>/dev/null || true
sleep 2

echo "  [生成 ecosystem.config.js]"
# Build ecosystem.config.js from .env so PORT and other vars are set correctly
ALINYUN_KEY=$(grep '^ALIYUN_API_KEY=' .env | head -1 | cut -d= -f2-)
OPENCLAW_URL=$(grep '^OPENCLAW_API_URL=' .env | head -1 | cut -d= -f2-)
OPENCLAW_KEY=$(grep '^OPENCLAW_API_KEY=' .env | head -1 | cut -d= -f2-)
HERMES_URL=$(grep '^HERMES_API_URL=' .env | head -1 | cut -d= -f2-)
DB_URL=$(grep '^DATABASE_URL=' .env | head -1 | cut -d= -f2-)

cat > ecosystem.config.js << JSEOF
module.exports = {
  apps: [
    {
      name: "ip-copilot",
      script: "/opt/chuangshizhe-copilot/apps/ip-copilot/.next/standalone/apps/ip-copilot/server.js",
      cwd: "/opt/chuangshizhe-copilot/apps/ip-copilot/.next/standalone",
      instances: 1,
      exec_mode: "cluster",
      autorestart: true,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        HOSTNAME: "0.0.0.0",
        DATABASE_URL: "${DB_URL}",
        ALIYUN_API_KEY: "${ALINYUN_KEY}",
        OPENCLAW_API_URL: "${OPENCLAW_URL}",
        OPENCLAW_API_KEY: "${OPENCLAW_KEY}",
        HERMES_API_URL: "${HERMES_URL}",
      },
      error_file: "/var/log/pm2/ip-copilot-error.log",
      out_file: "/var/log/pm2/ip-copilot-out.log",
      merge_logs: true,
    },
    {
      name: "admin",
      script: "/opt/chuangshizhe-copilot/apps/admin/.next/standalone/apps/admin/server.js",
      cwd: "/opt/chuangshizhe-copilot/apps/admin/.next/standalone",
      instances: 1,
      exec_mode: "cluster",
      autorestart: true,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: "3002",
        HOSTNAME: "0.0.0.0",
        DATABASE_URL: "${DB_URL}",
      },
      error_file: "/var/log/pm2/admin-error.log",
      out_file: "/var/log/pm2/admin-out.log",
      merge_logs: true,
    },
  ],
};
JSEOF

echo "  [启动新进程]"
pm2 start ecosystem.config.js
pm2 save

sleep 3
echo ""
echo "  [状态]"
pm2 list

# Health check
echo ""
echo "  [健康检查]"
IP_CODE=\$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000)
ADMIN_CODE=\$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3002)
echo "  ip-copilot (3000): \$IP_CODE"
echo "  admin (3002):      \$ADMIN_CODE"
REMOTE

echo ""
echo "=========================================="
echo "  部署完成！版本: $VERSION"
echo "=========================================="
echo "  IP 内容工作台: http://111.228.45.216:3000/home"
echo "  统一管理后台:   http://111.228.45.216:3002"
echo ""
echo "  日志: ssh $SERVER 'pm2 logs'"
echo "  状态: ssh $SERVER 'pm2 status'"
echo "=========================================="

# 清理本地
rm -f "$ARCHIVE"
