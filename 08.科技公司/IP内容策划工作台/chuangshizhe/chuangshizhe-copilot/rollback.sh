#!/usr/bin/env bash
# rollback.sh - 双容器回滚到指定版本
# 用法:
#   bash rollback.sh           # 列出所有版本，选一个回滚
#   bash rollback.sh v-abc123  # 直接回滚到指定版本
set -e

SERVER="root@111.228.45.216"

echo "=== 服务器上可用版本 ==="
IMAGES=$(ssh "$SERVER" "docker images copilot-ip copilot-edu copilot-admin --format '{{.Repository}}\t{{.Tag}}\t{{.CreatedAt}}\t{{.ID}}' | grep -v 'latest' | sort -k3 -r")

if [ -z "$IMAGES" ]; then
  echo "错误：没有找到可回滚的旧版本镜像"
  exit 1
fi

echo "序号  镜像          版本标签                      构建时间"
echo "----  ----------    --------------------------    -------------------"
i=0
declare -A TAG_MAP
declare -A IMG_MAP
while IFS=$'\t' read -r repo tag created id; do
  i=$((i + 1))
  TAG_MAP[$i]="$tag"
  IMG_MAP[$i]="$repo"
  printf "%-5s %-14s %-28s %s\n" "$i" "$repo" "$tag" "$created"
done <<< "$IMAGES"
TOTAL=$i
echo ""

# 如果命令行指定了版本号
if [ -n "$1" ]; then
  TARGET_TAG="$1"
else
  # 交互式选择
  read -p "输入要回滚的序号 (1-$TOTAL)，或回车回滚到上一个版本: " choice
  if [ -z "$choice" ]; then
    TARGET_TAG="${TAG_MAP[1]}"
  else
    if [ -z "${TAG_MAP[$choice]}" ]; then
      echo "错误：无效序号 $choice"
      exit 1
    fi
    TARGET_TAG="${TAG_MAP[$choice]}"
  fi
fi

# 找到同版本的所有镜像
TARGET_IMAGES=""
for k in "${!TAG_MAP[@]}"; do
  if [ "${TAG_MAP[$k]}" = "$TARGET_TAG" ]; then
    TARGET_IMAGES="$TARGET_IMAGES ${IMG_MAP[$k]}"
  fi
done

echo "=== 回滚到版本: $TARGET_TAG ==="
echo "涉及镜像: $TARGET_IMAGES"

ssh "$SERVER" << REMOTE
TARGET_TAG="$TARGET_TAG"

# === 回滚 IP 工作台 ===
echo "--- 回滚 IP 内容工作台 ---"
docker stop copilot-ip 2>/dev/null || true
docker rename copilot-ip copilot-ip-failed 2>/dev/null || true
docker run -d \
  --name copilot-ip \
  --restart always \
  --network host \
  -e DATABASE_URL="postgresql://chuangshizhe_user:Csj2026Secure%21@127.0.0.1:5432/chuangshizhe" \
  -e ALIYUN_API_KEY="sk-sp-1698373d17b74e1bab3d7bccc171f556" \
  -e NODE_ENV=production \
  copilot-ip:\$TARGET_TAG

# === 回滚 启明盒子 ===
echo "--- 回滚 启明盒子 ---"
docker stop copilot-edu 2>/dev/null || true
docker rename copilot-edu copilot-edu-failed 2>/dev/null || true
docker run -d \
  --name copilot-edu \
  --restart always \
  --network host \
  -e DATABASE_URL="postgresql://chuangshizhe_user:Csj2026Secure%21@127.0.0.1:5432/chuangshizhe" \
  -e ALIYUN_API_KEY="sk-sp-1698373d17b74e1bab3d7bccc171f556" \
  -e NODE_ENV=production \
  copilot-edu:\$TARGET_TAG

# === 回滚 统一管理平台 ===
echo "--- 回滚 统一管理平台 ---"
docker stop copilot-admin 2>/dev/null || true
docker rename copilot-admin copilot-admin-failed 2>/dev/null || true
docker run -d \
  --name copilot-admin \
  --restart always \
  --network host \
  -e DATABASE_URL="postgresql://chuangshizhe_user:Csj2026Secure%21@127.0.0.1:5432/chuangshizhe" \
  -e NODE_ENV=production \
  copilot-admin:\$TARGET_TAG

echo "三容器已回滚到版本: \$TARGET_TAG"
REMOTE

echo ""
echo "=== 回滚完成！==="
echo "IP 内容工作台: http://111.228.45.216:3000/home"
echo "启明盒子:      http://111.228.45.216:3001"
