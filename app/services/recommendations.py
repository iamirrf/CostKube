"""
Resource right-sizing recommendation service
"""

from datetime import datetime
from typing import Any, Dict, List, Optional


class RecommendationService:
    def __init__(self):
        # Thresholds for recommendations
        self.low_cpu_threshold = 0.2  # 20% utilization
        self.high_cpu_threshold = 0.8  # 80% utilization
        self.low_memory_threshold = 0.3  # 30% utilization
        self.high_memory_threshold = 0.85  # 85% utilization

    def analyze_namespace(
        self,
        current_usage: Dict[str, Any],
        requested_resources: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Analyze namespace resource usage and provide recommendations

        Args:
            current_usage: Current CPU and memory usage
            requested_resources: Requested CPU and memory (if available)

        Returns:
            Dictionary with recommendations and potential savings
        """
        recommendations = []
        potential_savings = 0.0

        # If no requested resources, use a conservative estimate (2x current usage)
        if not requested_resources:
            requested_resources = {
                "cpu_mcores": current_usage["cpu_mcores"] * 2,
                "memory_bytes": current_usage["memory_bytes"] * 2,
            }

        # CPU analysis
        cpu_utilization = current_usage["cpu_mcores"] / max(
            requested_resources["cpu_mcores"], 1
        )

        if cpu_utilization < self.low_cpu_threshold:
            recommended_cpu = max(
                current_usage["cpu_mcores"] * 1.3, 100
            )  # 30% headroom, min 100m
            cpu_savings = (
                (requested_resources["cpu_mcores"] - recommended_cpu)
                / 1000
                * 0.031
                * 730
            )

            recommendations.append(
                {
                    "type": "CPU_OVERPROVISIONED",
                    "severity": "medium",
                    "resource": "CPU",
                    "current_usage": current_usage["cpu_mcores"],
                    "requested": requested_resources["cpu_mcores"],
                    "recommended": recommended_cpu,
                    "utilization": cpu_utilization * 100,
                    "savings": cpu_savings,
                    "message": (
                        f"CPU usage is only {cpu_utilization*100:.1f}%. "
                        f"Consider reducing CPU request from "
                        f"{requested_resources['cpu_mcores']}m to "
                        f"{recommended_cpu:.0f}m cores."
                    ),
                }
            )
            potential_savings += cpu_savings

        elif cpu_utilization > self.high_cpu_threshold:
            recommended_cpu = current_usage["cpu_mcores"] * 1.5  # 50% headroom

            recommendations.append(
                {
                    "type": "CPU_UNDERPROVISIONED",
                    "severity": "high",
                    "resource": "CPU",
                    "current_usage": current_usage["cpu_mcores"],
                    "requested": requested_resources["cpu_mcores"],
                    "recommended": recommended_cpu,
                    "utilization": cpu_utilization * 100,
                    "savings": 0,
                    "message": (
                        f"CPU usage is {cpu_utilization*100:.1f}%. "
                        f"Risk of throttling! Consider increasing CPU request "
                        f"from {requested_resources['cpu_mcores']}m to "
                        f"{recommended_cpu:.0f}m cores."
                    ),
                }
            )

        # Memory analysis
        memory_utilization = current_usage["memory_bytes"] / max(
            requested_resources["memory_bytes"], 1
        )

        if memory_utilization < self.low_memory_threshold:
            recommended_memory = max(
                current_usage["memory_bytes"] * 1.3, 128 * 1024 * 1024
            )  # 30% headroom, min 128Mi
            memory_savings = (
                (requested_resources["memory_bytes"] - recommended_memory)
                / (1024**3)
                * 0.004
                * 730
            )

            recommendations.append(
                {
                    "type": "MEMORY_OVERPROVISIONED",
                    "severity": "medium",
                    "resource": "Memory",
                    "current_usage": current_usage["memory_bytes"],
                    "requested": requested_resources["memory_bytes"],
                    "recommended": recommended_memory,
                    "utilization": memory_utilization * 100,
                    "savings": memory_savings,
                    "message": (
                        f"Memory usage is only {memory_utilization*100:.1f}%. "
                        f"Consider reducing memory request from "
                        f"{requested_resources['memory_bytes']/(1024**3):.2f}Gi "
                        f"to {recommended_memory/(1024**3):.2f}Gi."
                    ),
                }
            )
            potential_savings += memory_savings

        elif memory_utilization > self.high_memory_threshold:
            recommended_memory = current_usage["memory_bytes"] * 1.3  # 30% headroom

            recommendations.append(
                {
                    "type": "MEMORY_UNDERPROVISIONED",
                    "severity": "high",
                    "resource": "Memory",
                    "current_usage": current_usage["memory_bytes"],
                    "requested": requested_resources["memory_bytes"],
                    "recommended": recommended_memory,
                    "utilization": memory_utilization * 100,
                    "savings": 0,
                    "message": (
                        f"Memory usage is {memory_utilization*100:.1f}%. "
                        f"Risk of OOMKill! Consider increasing memory request "
                        f"from {requested_resources['memory_bytes']/(1024**3):.2f}Gi "
                        f"to {recommended_memory/(1024**3):.2f}Gi."
                    ),
                }
            )

        return {
            "namespace": current_usage.get("namespace", "unknown"),
            "recommendations": recommendations,
            "potential_monthly_savings": potential_savings,
            "total_recommendations": len(recommendations),
            "high_severity_count": sum(
                1 for r in recommendations if r["severity"] == "high"
            ),
            "medium_severity_count": sum(
                1 for r in recommendations if r["severity"] == "medium"
            ),
        }

    def detect_idle_resources(
        self,
        namespace_data: Dict[str, Any],
        idle_threshold_cpu: float = 50.0,  # millicores
        idle_threshold_memory: float = 50 * 1024 * 1024,  # 50MB
    ) -> Optional[Dict[str, Any]]:
        """
        Detect idle or near-idle resources

        Args:
            namespace_data: Namespace usage data
            idle_threshold_cpu: CPU threshold in millicores
            idle_threshold_memory: Memory threshold in bytes

        Returns:
            Idle resource information if found, None otherwise
        """
        cpu = namespace_data["cpu_mcores"]
        memory = namespace_data["memory_bytes"]
        monthly_cost = namespace_data["monthly_cost"]

        if cpu < idle_threshold_cpu and memory < idle_threshold_memory:
            return {
                "namespace": namespace_data["namespace"],
                "type": "IDLE_RESOURCE",
                "severity": "high",
                "cpu_mcores": cpu,
                "memory_bytes": memory,
                "monthly_cost": monthly_cost,
                "potential_savings": monthly_cost * 0.95,  # 95% savings
                "message": (
                    f"Namespace appears idle (CPU: {cpu:.0f}m, "
                    f"Memory: {memory/(1024**2):.0f}Mi). "
                    f"Consider removing or consolidating workloads to save "
                    f"${monthly_cost:.2f}/month."
                ),
            }

        return None

    def analyze_all_namespaces(
        self, namespaces: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Analyze all namespaces and provide comprehensive recommendations

        Args:
            namespaces: List of namespace usage data

        Returns:
            Comprehensive analysis with all recommendations
        """
        all_recommendations = []
        total_potential_savings = 0.0
        idle_resources = []

        for ns in namespaces:
            # Check for idle resources
            idle_check = self.detect_idle_resources(ns)
            if idle_check:
                idle_resources.append(idle_check)
                total_potential_savings += idle_check["potential_savings"]

            # Get right-sizing recommendations
            analysis = self.analyze_namespace(ns)
            if analysis["recommendations"]:
                all_recommendations.append(analysis)
                total_potential_savings += analysis["potential_monthly_savings"]

        # Sort by potential savings
        all_recommendations.sort(
            key=lambda x: x["potential_monthly_savings"], reverse=True
        )

        return {
            "total_namespaces_analyzed": len(namespaces),
            "namespaces_with_recommendations": len(all_recommendations),
            "idle_resources": idle_resources,
            "right_sizing_recommendations": all_recommendations,
            "total_potential_monthly_savings": total_potential_savings,
            "high_priority_count": sum(
                r["high_severity_count"] for r in all_recommendations
            ),
            "medium_priority_count": sum(
                r["medium_severity_count"] for r in all_recommendations
            ),
            "idle_resource_count": len(idle_resources),
            "timestamp": datetime.now().isoformat(),
        }


# Global recommendation service instance
recommendation_service = RecommendationService()
