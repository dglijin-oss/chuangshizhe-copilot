#!/usr/bin/env bash
# rollback.sh - 回滚到指定版本
# 用法:
#   bash rollback.sh           # 列出所有版本，选一个回滚
#   bash rollback.sh v-abc123  # 直接回滚到指定版本
set -e

SERVER="root@111.228.45.216"

echo "=== 服务器上可用版本 ==="
IMAGES=$(ssh "$SERVER" "docker images chuangshizhe-copilot --format '{{.Tag}}\t{{.CreatedAt}}\t{{.ID}}' | grep -v 'latest' | sort -k2 -r")

if [ -z "$IMAGES" ]; then
  echo "错误：没有找到可回滚的旧版本镜像"
  exit 1
fi

echo "序号  版本标签                      构建时间"
echo "----  --------------------------    -------------------"
i=0
declare -A TAG_MAP
while IFS=$'\t' read -r tag created id; do
  i=$((i + 1))
  TAG_MAP[$i]="$tag"
  printf "%-5s %-28s %s\n" "$i" "$tag" "$created"
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
    # 默认回滚到上一个（即列表第一行）
    TARGET_TAG="${TAG_MAP[1]}"
  else
    if [ -z "${TAG_MAP[$choice]}" ]; then
      echo "错误：无效序号 $choice"
      exit 1
    fi
    TARGET_TAG="${TAG_MAP[$choice]}"
  fi
fi

echo "=== 回滚到: chuangshizhe-copilot:$TARGET_TAG ==="

ssh "$SERVER" << REMOTE
# 记录当前版本
CURRENT_IMAGE=\$(docker inspect chuangshizhe-copilot --format '{{.Config.Image}}' 2>/dev/null || echo "unknown")
echo "当前版本: \$CURRENT_IMAGE"

# 停止当前容器并保留
docker stop chuangshizhe-copilot 2>/dev/null || true
docker rename chuangshizhe-copilot chuangshizhe-copilot-failed 2>/dev/null || true

# 启动目标版本
docker run -d \
  --name chuangshizhe-copilot \
  --restart always \
  --network host \
  -e DATABASE_URL="postgresql://chuangshizhe_user:Csj2026Secure%21@127.0.0.1:5432/chuangshizhe" \
  -e ALIYUN_API_KEY="sk-sp-1698373d17b74e1bab3d7bccc171f556" \
  -e NODE_ENV=production \
  chuangshizhe-copilot:$TARGET_TAG

echo "已回滚到版本: $TARGET_TAG"
REMOTE

echo ""
echo "=== 回滚完成！访问 http://111.228.45.216:3000 ==="
echo "查看日志: ssh root@111.228.45.216 'docker logs -f chuangshizhe-copilot'"
