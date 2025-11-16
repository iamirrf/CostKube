import csv
import io
import json
from datetime import datetime
from typing import Any, Dict, Optional

from fastapi import (APIRouter, HTTPException, Query, Response, WebSocket,
                     WebSocketDisconnect)
from fastapi.responses import StreamingResponse

from ..services.cost_model import CostModel
from ..services.database import db_service
from ..services.forecasting import forecast_service
from ..services.k8s_client import KubernetesClient
from ..services.recommendations import recommendation_service

router = APIRouter()
k8s_client = KubernetesClient()
cost_model = CostModel()


# WebSocket connections manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass


manager = ConnectionManager()


@router.get("/api/namespaces")
async def get_namespaces(
    save_history: bool = Query(True, description="Save metrics to database")
) -> Dict[str, Any]:
    """Get real-time namespace cost data from Kubernetes cluster"""
    namespace_usage = k8s_client.get_namespace_usage()

    if namespace_usage is None:
        raise HTTPException(
            status_code=503,
            detail="Kubernetes cluster not available. Please ensure cluster is running and metrics-server is installed.",
        )

    namespace_costs = cost_model.compute_cost(namespace_usage)

    # Save to database for historical tracking
    if save_history:
        try:
            await db_service.save_namespace_metrics(namespace_costs)
        except Exception as e:
            print(f"Warning: Failed to save metrics to database: {e}")

    return {"data": namespace_costs, "demo_mode": False}


@router.get("/api/pods")
async def get_pods(
    namespace: str = None,
    save_history: bool = Query(True, description="Save metrics to database"),
) -> Dict[str, Any]:
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

    # Save to database for historical tracking
    if save_history:
        try:
            await db_service.save_pod_metrics(pod_costs)
        except Exception as e:
            print(f"Warning: Failed to save pod metrics to database: {e}")

    return {"data": pod_costs, "demo_mode": False}


@router.get("/api/config")
async def get_config() -> Dict[str, Any]:
    """Get cost configuration and cluster status"""
    # Check if using simulated cluster or real cluster
    is_simulated = k8s_client.simulated_cluster is not None
    k8s_available = k8s_client.metrics_api is not None or is_simulated

    return {
        "cost_config": cost_model.cost_config,
        "demo_mode": False,  # Always show as live (simulated is still "live-like")
        "k8s_available": k8s_available,
        "mode": "simulated" if is_simulated else "real",
    }


@router.get("/api/health")
async def health_check() -> Dict[str, Any]:
    """Health check endpoint with detailed diagnostics"""
    is_simulated = k8s_client.simulated_cluster is not None
    k8s_available = k8s_client.metrics_api is not None or is_simulated
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
        "mode": "simulated" if is_simulated else "real",
    }


# ==================== HISTORICAL DATA ENDPOINTS ====================


@router.get("/api/history/namespaces")
async def get_namespace_history(
    namespace: Optional[str] = Query(None, description="Filter by namespace"),
    hours: int = Query(24, description="Hours of history to retrieve"),
) -> Dict[str, Any]:
    """Get historical namespace metrics"""
    try:
        history = await db_service.get_namespace_history(namespace, hours)
        return {
            "data": history,
            "namespace": namespace,
            "hours": hours,
            "count": len(history),
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error retrieving history: {str(e)}"
        )


@router.get("/api/history/trends")
async def get_cost_trends(
    hours: int = Query(168, description="Hours of trend data (default: 7 days)")
) -> Dict[str, Any]:
    """Get cost trend data for visualizations"""
    try:
        trends = await db_service.get_cost_trends(hours)
        return trends
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error retrieving trends: {str(e)}"
        )


@router.get("/api/history/top-namespaces")
async def get_top_namespaces(
    limit: int = Query(10, description="Number of top namespaces"),
    hours: int = Query(24, description="Time period in hours"),
) -> Dict[str, Any]:
    """Get top namespaces by cost over a time period"""
    try:
        top = await db_service.get_top_namespaces(limit, hours)
        return {"data": top, "limit": limit, "hours": hours}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error retrieving top namespaces: {str(e)}"
        )


# ==================== EXPORT ENDPOINTS ====================


@router.get("/api/export/namespaces/csv")
async def export_namespaces_csv():
    """Export namespace cost data as CSV"""
    namespace_usage = k8s_client.get_namespace_usage()
    if namespace_usage is None:
        raise HTTPException(status_code=503, detail="Cluster not available")

    namespace_costs = cost_model.compute_cost(namespace_usage)

    # Create CSV
    output = io.StringIO()
    writer = csv.DictWriter(
        output,
        fieldnames=[
            "namespace",
            "cpu_mcores",
            "memory_bytes",
            "hourly_cost",
            "monthly_cost",
        ],
    )
    writer.writeheader()
    writer.writerows(namespace_costs)

    # Return as streaming response
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=costkube_namespaces_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        },
    )


@router.get("/api/export/namespaces/json")
async def export_namespaces_json():
    """Export namespace cost data as JSON"""
    namespace_usage = k8s_client.get_namespace_usage()
    if namespace_usage is None:
        raise HTTPException(status_code=503, detail="Cluster not available")

    namespace_costs = cost_model.compute_cost(namespace_usage)

    return Response(
        content=json.dumps(
            {
                "timestamp": datetime.now().isoformat(),
                "data": namespace_costs,
                "export_type": "namespaces",
            },
            indent=2,
        ),
        media_type="application/json",
        headers={
            "Content-Disposition": f"attachment; filename=costkube_namespaces_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        },
    )


# ==================== RECOMMENDATIONS ENDPOINTS ====================


@router.get("/api/recommendations")
async def get_recommendations() -> Dict[str, Any]:
    """Get resource right-sizing recommendations for all namespaces"""
    namespace_usage = k8s_client.get_namespace_usage()
    if namespace_usage is None:
        raise HTTPException(status_code=503, detail="Cluster not available")

    namespace_costs = cost_model.compute_cost(namespace_usage)
    recommendations = recommendation_service.analyze_all_namespaces(namespace_costs)

    return recommendations


@router.get("/api/recommendations/idle")
async def get_idle_resources() -> Dict[str, Any]:
    """Get idle or underutilized resources"""
    namespace_usage = k8s_client.get_namespace_usage()
    if namespace_usage is None:
        raise HTTPException(status_code=503, detail="Cluster not available")

    namespace_costs = cost_model.compute_cost(namespace_usage)
    idle_resources = []

    for ns in namespace_costs:
        idle_check = recommendation_service.detect_idle_resources(ns)
        if idle_check:
            idle_resources.append(idle_check)

    total_savings = sum(r["potential_savings"] for r in idle_resources)

    return {
        "idle_resources": idle_resources,
        "count": len(idle_resources),
        "total_potential_savings": total_savings,
    }


# ==================== FORECASTING ENDPOINTS ====================


@router.get("/api/forecast")
async def get_cost_forecast(
    days: int = Query(30, description="Number of days to forecast")
) -> Dict[str, Any]:
    """Get cost forecast based on historical trends"""
    try:
        # Get historical data
        trends = await db_service.get_cost_trends(hours=168)  # Last 7 days

        if not trends["timestamps"]:
            raise HTTPException(
                status_code=400,
                detail="Insufficient historical data. Please wait for data collection.",
            )

        # Prepare data for forecasting
        historical_data = [
            {"timestamp": ts, "total_cost": cost, "hourly_cost": cost}
            for ts, cost in zip(trends["timestamps"], trends["costs"])
        ]

        forecast = forecast_service.forecast_costs(historical_data, days)

        if "error" in forecast:
            raise HTTPException(status_code=400, detail=forecast["error"])

        return forecast

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecast error: {str(e)}")


@router.get("/api/forecast/budget-runway")
async def get_budget_runway(
    budget: float = Query(..., description="Remaining budget amount")
) -> Dict[str, Any]:
    """Predict when budget will be exhausted"""
    try:
        trends = await db_service.get_cost_trends(hours=168)

        if not trends["timestamps"]:
            raise HTTPException(status_code=400, detail="Insufficient historical data")

        historical_data = [
            {"timestamp": ts, "total_cost": cost, "hourly_cost": cost}
            for ts, cost in zip(trends["timestamps"], trends["costs"])
        ]

        runway = forecast_service.predict_budget_runway(historical_data, budget)

        if "error" in runway:
            raise HTTPException(status_code=400, detail=runway["error"])

        return runway

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Budget runway error: {str(e)}")


# ==================== WEBSOCKET ENDPOINT ====================


@router.websocket("/ws/metrics")
async def websocket_metrics(websocket: WebSocket):
    """WebSocket endpoint for real-time metric updates"""
    await manager.connect(websocket)

    try:
        while True:
            # Wait for ping from client
            data = await websocket.receive_text()

            if data == "ping":
                # Fetch latest metrics
                namespace_usage = k8s_client.get_namespace_usage()

                if namespace_usage:
                    namespace_costs = cost_model.compute_cost(namespace_usage)

                    # Send update
                    await websocket.send_json(
                        {
                            "type": "metrics_update",
                            "data": namespace_costs,
                            "timestamp": datetime.now().isoformat(),
                        }
                    )
                else:
                    await websocket.send_json(
                        {"type": "error", "message": "Cluster unavailable"}
                    )

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)
