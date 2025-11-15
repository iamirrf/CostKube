from typing import Any, Dict, List, Optional
import os

from kubernetes import client, config
from kubernetes.client.rest import ApiException

from app.services.simulated_k8s import SimulatedKubernetesCluster


class KubernetesClient:
    def __init__(self):
        self.api_client = None
        self.metrics_api = None
        self.simulated_cluster = None
        self.use_simulated = os.getenv("USE_SIMULATED_CLUSTER", "true").lower() == "true"
        self._init_k8s_client()

    def _init_k8s_client(self):
        """Initialize Kubernetes client with in-cluster, kubeconfig, or simulated cluster"""
        # Check if simulated mode is forced
        if self.use_simulated:
            print("🎮 USE_SIMULATED_CLUSTER enabled - using simulated live data")
            self.simulated_cluster = SimulatedKubernetesCluster()
            return
        
        try:
            # Try in-cluster config first
            config.load_incluster_config()
            print("✅ Using in-cluster configuration")
        except config.ConfigException as e:
            print(f"⚠️  In-cluster config failed: {e}")
            try:
                # Fall back to kubeconfig
                config.load_kube_config()
                print("✅ Using local kubeconfig")
            except config.ConfigException as e2:
                print(f"❌ Could not load Kubernetes configuration: {e2}")
                print("🎮 Falling back to simulated cluster with live-like data")
                self.simulated_cluster = SimulatedKubernetesCluster()
                return

        self.api_client = client.ApiClient()
        self.metrics_api = client.CustomObjectsApi(self.api_client)
        print("✅ Kubernetes client initialized successfully")

    def get_namespace_usage(self) -> Optional[List[Dict[str, Any]]]:
        """Get CPU and memory usage per namespace from metrics API or simulated cluster"""
        # Use simulated cluster if available
        if self.simulated_cluster:
            return self.simulated_cluster.get_namespace_usage()
        
        if not self.metrics_api:
            return None

        try:
            # Aggregate pod metrics by namespace
            namespace_usage = {}

            # Get pod metrics
            pod_metrics = self.metrics_api.list_cluster_custom_object(
                group="metrics.k8s.io", version="v1beta1", plural="pods"
            )

            for pod_item in pod_metrics.get("items", []):
                namespace = pod_item.get("metadata", {}).get("namespace", "default")

                if namespace not in namespace_usage:
                    namespace_usage[namespace] = {
                        "namespace": namespace,
                        "cpu_mcores": 0,
                        "memory_bytes": 0,
                    }

                for container in pod_item.get("containers", []):
                    usage = container.get("usage", {})

                    # Process CPU usage
                    cpu_str = usage.get("cpu", "0")
                    if cpu_str.endswith("n"):
                        # Convert nanocores to millicores
                        cpu_mcores = int(cpu_str[:-1]) / 1000000
                    elif cpu_str.endswith("u"):
                        # Convert microcores to millicores
                        cpu_mcores = int(cpu_str[:-1]) / 1000
                    elif cpu_str.endswith("m"):
                        # Already in millicores
                        cpu_mcores = int(cpu_str[:-1])
                    else:
                        # Cores to millicores
                        cpu_mcores = float(cpu_str) * 1000

                    namespace_usage[namespace]["cpu_mcores"] += cpu_mcores

                    # Process memory usage
                    mem_str = usage.get("memory", "0")
                    if mem_str.endswith("Ki"):
                        # Convert kibibytes to bytes
                        memory_bytes = int(mem_str[:-2]) * 1024
                    elif mem_str.endswith("Mi"):
                        # Convert mebibytes to bytes
                        memory_bytes = int(mem_str[:-2]) * 1024 * 1024
                    elif mem_str.endswith("Gi"):
                        # Convert gibibytes to bytes
                        memory_bytes = int(mem_str[:-2]) * 1024 * 1024 * 1024
                    elif mem_str.endswith("Ti"):
                        # Convert tebibytes to bytes
                        memory_bytes = int(mem_str[:-2]) * 1024 * 1024 * 1024 * 1024
                    elif mem_str.endswith("Pi"):
                        # Convert pebibytes to bytes
                        memory_bytes = (
                            int(mem_str[:-2]) * 1024 * 1024 * 1024 * 1024 * 1024
                        )
                    else:
                        # Assume bytes
                        memory_bytes = int(mem_str)

                    namespace_usage[namespace]["memory_bytes"] += memory_bytes

            return list(namespace_usage.values())

        except ApiException as e:
            print(f"Error fetching metrics: {e}")
            return None

    def get_pod_usage(self) -> Optional[List[Dict[str, Any]]]:
        """Get CPU and memory usage per pod from metrics API or simulated cluster"""
        # Use simulated cluster if available
        if self.simulated_cluster:
            return self.simulated_cluster.get_pod_usage()
        
        if not self.metrics_api:
            return None

        try:
            # Get pod metrics
            pod_metrics = self.metrics_api.list_cluster_custom_object(
                group="metrics.k8s.io", version="v1beta1", plural="pods"
            )

            pod_usage = []

            for pod_item in pod_metrics.get("items", []):
                namespace = pod_item.get("metadata", {}).get("namespace", "default")

                for container in pod_item.get("containers", []):
                    pod_name = pod_item.get("metadata", {}).get("name", "unknown")

                    usage = container.get("usage", {})

                    # Process CPU usage
                    cpu_str = usage.get("cpu", "0")
                    if cpu_str.endswith("n"):
                        # Convert nanocores to millicores
                        cpu_mcores = int(cpu_str[:-1]) / 1000000
                    elif cpu_str.endswith("u"):
                        # Convert microcores to millicores
                        cpu_mcores = int(cpu_str[:-1]) / 1000
                    elif cpu_str.endswith("m"):
                        # Already in millicores
                        cpu_mcores = int(cpu_str[:-1])
                    else:
                        # Cores to millicores
                        cpu_mcores = float(cpu_str) * 1000

                    # Process memory usage
                    mem_str = usage.get("memory", "0")
                    if mem_str.endswith("Ki"):
                        # Convert kibibytes to bytes
                        memory_bytes = int(mem_str[:-2]) * 1024
                    elif mem_str.endswith("Mi"):
                        # Convert mebibytes to bytes
                        memory_bytes = int(mem_str[:-2]) * 1024 * 1024
                    elif mem_str.endswith("Gi"):
                        # Convert gibibytes to bytes
                        memory_bytes = int(mem_str[:-2]) * 1024 * 1024 * 1024
                    elif mem_str.endswith("Ti"):
                        # Convert tebibytes to bytes
                        memory_bytes = int(mem_str[:-2]) * 1024 * 1024 * 1024 * 1024
                    elif mem_str.endswith("Pi"):
                        # Convert pebibytes to bytes
                        memory_bytes = (
                            int(mem_str[:-2]) * 1024 * 1024 * 1024 * 1024 * 1024
                        )
                    else:
                        # Assume bytes
                        memory_bytes = int(mem_str)

                    pod_usage.append(
                        {
                            "namespace": namespace,
                            "pod": pod_name,
                            "cpu_mcores": cpu_mcores,
                            "memory_bytes": memory_bytes,
                        }
                    )

            return pod_usage

        except ApiException as e:
            print(f"Error fetching pod metrics: {e}")
            return None
