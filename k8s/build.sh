#!/bin/bash
# pm-msa 전체 서비스 Docker 이미지 빌드
# 사용법: ./k8s/build.sh [서비스명]
#   ./k8s/build.sh          → 전체 빌드
#   ./k8s/build.sh pm-auth  → pm-auth만 빌드

set -e
cd "$(dirname "$0")/.."

build_image() {
  local name=$1
  local context=$2
  local dockerfile=$3
  echo "======== Building $name ========"
  docker build -t "$name:latest" -f "$dockerfile" "$context"
  echo "✓ $name built"
  echo ""
}

if [ -n "$1" ]; then
  # 개별 빌드
  case "$1" in
    eureka-server) build_image pm-eureka-server pm-infra pm-infra/eureka-server/Dockerfile ;;
    gateway)       build_image pm-gateway pm-infra pm-infra/gateway/Dockerfile ;;
    pm-auth)       build_image pm-auth pm-auth pm-auth/Dockerfile ;;
    pm-document)   build_image pm-document pm-document pm-document/Dockerfile ;;
    pm-agent)      build_image pm-agent pm-agent pm-agent/Dockerfile ;;
    pm-workflow)   build_image pm-workflow pm-workflow pm-workflow/Dockerfile ;;
    pm-web)        build_image pm-web pm-web pm-web/Dockerfile ;;
    *) echo "Unknown service: $1"; exit 1 ;;
  esac
else
  # 전체 빌드
  build_image pm-eureka-server pm-infra pm-infra/eureka-server/Dockerfile
  build_image pm-gateway      pm-infra pm-infra/gateway/Dockerfile
  build_image pm-auth         pm-auth pm-auth/Dockerfile
  build_image pm-document     pm-document pm-document/Dockerfile
  build_image pm-agent        pm-agent pm-agent/Dockerfile
  build_image pm-workflow     pm-workflow pm-workflow/Dockerfile
  build_image pm-web          pm-web pm-web/Dockerfile
  echo "======== 전체 빌드 완료 ========"
fi
