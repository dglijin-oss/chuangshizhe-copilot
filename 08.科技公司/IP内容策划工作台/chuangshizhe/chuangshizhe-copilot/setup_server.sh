#!/usr/bin/env bash
# setup_server.sh - 首次部署：服务器环境初始化
# 用法: ssh root@111.228.45.216 'bash -s' < setup_server.sh
set -e

echo "=========================================="
echo "  创世者 Copilot - 服务器环境初始化"
echo "=========================================="

# === Node.js 20 ===
echo ""
echo ">>> 检查 Node.js..."
if command -v node &>/dev/null; then
  NODE_VER=$(node -v)
  echo "  已安装: $NODE_VER"
else
  echo "  安装 Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
  echo "  已安装: $(node -v)"
fi

# === pnpm ===
echo ""
echo ">>> 检查 pnpm..."
if command -v pnpm &>/dev/null; then
  PNPM_VER=$(pnpm -v)
  echo "  已安装: v$PNPM_VER"
else
  echo "  安装 pnpm..."
  npm install -g pnpm@9
  echo "  已安装: $(pnpm -v)"
fi

# === PM2 ===
echo ""
echo ">>> 检查 PM2..."
if command -v pm2 &>/dev/null; then
  PM2_VER=$(pm2 -v)
  echo "  已安装: v$PM2_VER"
else
  echo "  安装 PM2..."
  npm install -g pm2
  echo "  已安装: $(pm2 -v)"
fi

# === PostgreSQL ===
echo ""
echo ">>> 检查 PostgreSQL..."
if systemctl is-active --quiet postgresql || pg_isready &>/dev/null; then
  echo "  PostgreSQL 运行中"
else
  echo "  PostgreSQL 未运行，请确认数据库配置"
fi

# === 创建项目目录 ===
echo ""
echo ">>> 创建项目目录..."
mkdir -p /opt/chuangshizhe-copilot
mkdir -p /var/log/pm2

# === 创建 .env 文件 ===
echo ""
echo ">>> 创建 .env 文件..."
if [ -f /opt/chuangshizhe-copilot/.env ]; then
  echo "  .env 已存在，跳过"
  cat /opt/chuangshizhe-copilot/.env
else
  cat > /opt/chuangshizhe-copilot/.env << 'EOF'
DATABASE_URL="postgresql://chuangshizhe_user:Csj2026Secure%21@127.0.0.1:5432/chuangshizhe"
ALIYUN_API_KEY="sk-sp-1698373d17b74e1bab3d7bccc171f556"
OPENCLAW_API_URL="http://127.0.0.1:18789"
OPENCLAW_API_KEY="exb65abpkt72xenkzjsfectwmrmjes33"
EOF
  echo "  .env 已创建（请根据实际情况修改）"
fi

# === PM2 启动脚本 ===
echo ""
echo ">>> 配置 PM2 开机启动..."
pm2 save 2>/dev/null || true
pm2 startup 2>/dev/null || true

echo ""
echo "=========================================="
echo "  环境初始化完成！"
echo "=========================================="
echo "  下一步: 运行 bash deploy.sh 进行部署"
echo "=========================================="
