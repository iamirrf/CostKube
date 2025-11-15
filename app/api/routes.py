from typing import Any, Dict

from fastapi import APIRouter, HTTPException

from ..services.cost_model import CostModel
from ..services.k8s_client import KubernetesClient

router = APIRouter()
k8s_client = KubernetesClient()
cost_model = CostModel()


@router.get("/api/namespaces")
async def get_namespaces() -> Dict[str, Any]:
    """Get real-time namespace cost data from Kubernetes cluster"""
    namespace_usage = k8s_client.get_namespace_usage()

    if namespace_usage is None:
        raise HTTPException(
            status_code=503,
            detail="Kubernetes cluster not available. Please ensure cluster is running and metrics-server is installed.",
        )

    namespace_costs = cost_model.compute_cost(namespace_usage)
    return {"data": namespace_costs, "demo_mode": False}


@router.get("/api/pods")
async def get_pods(namespace: str = None) -> Dict[str, Any]:
    """Get real-time pod cost data from Kubernetes cluster"""
    pod_usage = k8s_client.get_pod_usage()

    if pod_usage is None:
        raise HTTPException(
            status_code=503,
            detail="Kubernetes cluster not available. Please ensure cluster is running and metrics-server is installed.",
        )

    if namespace:
        pod_usage = [pod for pod in pod_usage if pod["namespace"] == namespace]

    pod_costs = cost_model.compute_cost(pod_usage)
    return {"data": pod_costs, "demo_mode": False}


@router.get("/api/config")
async def get_config() -> Dict[str, Any]:
    """Get cost configuration and cluster status"""
    k8s_available = k8s_client.metrics_api is not None

    return {
        "cost_config": cost_model.cost_config,
        "demo_mode": False,
        "k8s_available": k8s_available,
    }


@router.get("/api/health")
async def health_check() -> Dict[str, Any]:
    """Health check endpoint with detailed diagnostics"""
    k8s_available = k8s_client.metrics_api is not None
    metrics_available = False

    if k8s_available:
        try:
            # Try to fetch metrics to verify full functionality
            namespace_usage = k8s_client.get_namespace_usage()
            metrics_available = namespace_usage is not None and len(namespace_usage) > 0
        except Exception as e:
            print(f"Metrics check failed: {e}")

    return {
        "status": "healthy",
        "k8s_client_initialized": k8s_available,
        "metrics_server_available": metrics_available,
        "demo_mode": False,
    }
