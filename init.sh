#!/bin/bash

echo "=== AI培训项目本地环境初始化 ==="

# 检查基础环境
echo "1. 检查基础环境..."
git --version
node -v
npm -v

# 初始化Git仓库（如果尚未初始化）
if [ ! -d ".git" ]; then
    echo "2. 初始化Git仓库..."
    git init
fi

# 创建代码目录结构
echo "3. 创建代码目录结构..."
mkdir -p code/sql code/test code/src

# 显示当前状态
echo "4. 显示当前状态..."
git status

echo "=== 初始化完成 ==="
echo "请参考以下文档进行下一步配置："
echo "- doc/06-开发参考/01-开发环境配置.md"
echo "- doc/06-开发参考/05-AI本地初始化建议.md"