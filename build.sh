#!/bin/bash
base=$(cd "$(dirname "$0")";pwd)
cd $base
docker run -it --rm --name buildOpenRenamer --user ${UID} -v $base/openRenamerFront:/opt/front node:lts-buster-slim  bash -c "cd /opt/front &&   yarn --registry https://registry.npm.taobao.org && yarn build"

rm -rf openRenamerBackend/static/*
touch openRenamerBackend/static/.gitkeep
mv openRenamerFront/dist/*  openRenamerBackend/static

# 单平台打包并推送
#docker build -t fleyx/open-renamer:$0 --push .
# 多平台打包并推送
docker buildx build -t fleyx/open-renamer:$1 --platform linux/amd64,linux/arm64 --push .