#!/bin/bash
# pm-msa K8s 배포 스크립트
# 사용법:
#   ./k8s/deploy.sh          → 전체 배포
#   ./k8s/deploy.sh delete   → 전체 삭제

set -e
cd "$(dirname "$0")"

case "${1:-apply}" in
  apply)
    echo "======== pm-msa K8s 배포 ========"
    kubectl apply -k .
    echo ""
    echo "배포 완료. Pod 상태 확인:"
    kubectl get pods -n pm-msa
    echo ""
    echo "접속 정보:"
    echo "  Gateway: http://localhost:30080"
    echo "  Web:     http://localhost:30000"
    ;;
  delete)
    echo "======== pm-msa K8s 삭제 ========"
    kubectl delete namespace pm-msa
    echo "삭제 완료"
    ;;
  status)
    kubectl get all -n pm-msa
    ;;
  *)
    echo "사용법: $0 [apply|delete|status]"
    exit 1
    ;;
esac
