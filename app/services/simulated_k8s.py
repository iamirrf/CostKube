"""
Simulated Kubernetes Metrics Generator
Generates realistic, time-varying Kubernetes metrics without requiring a real cluster.
Perfect for demos and development.
"""

import random
import time
from typing import Any, Dict, List


class SimulatedKubernetesCluster:
    """Simulates a realistic Kubernetes cluster with time-varying metrics"""
    
    def __init__(self):
        self.start_time = time.time()
        
        # Define realistic workloads
        self.workloads = {
            "production": [
                {"name": "nginx-web", "replicas": 3, "cpu_base": 150, "mem_base": 512},
                {"name": "api-gateway", "replicas": 2, "cpu_base": 200, "mem_base": 768},
                {"name": "redis-cache", "replicas": 2, "cpu_base": 100, "mem_base": 1024},
                {"name": "postgres-db", "replicas": 1, "cpu_base": 300, "mem_base": 2048},
                {"name": "monitoring", "replicas": 1, "cpu_base": 80, "mem_base": 384},
            ],
            "development": [
                {"name": "webapp-dev", "replicas": 2, "cpu_base": 100, "mem_base": 256},
                {"name": "api-dev", "replicas": 2, "cpu_base": 120, "mem_base": 384},
                {"name": "database-dev", "replicas": 1, "cpu_base": 150, "mem_base": 512},
            ],
            "staging": [
                {"name": "test-app", "replicas": 1, "cpu_base": 80, "mem_base": 256},
                {"name": "integration-tests", "replicas": 1, "cpu_base": 120, "mem_base": 384},
            ],
            "monitoring": [
                {"name": "prometheus", "replicas": 1, "cpu_base": 250, "mem_base": 1536},
                {"name": "grafana", "replicas": 1, "cpu_base": 100, "mem_base": 512},
            ],
        }
    
    def _get_time_variance(self) -> float:
        """Generate realistic time-based variance (simulates daily patterns)"""
        elapsed = time.time() - self.start_time
        # Create a sinusoidal pattern that repeats every 60 seconds (simulating daily cycle)
        cycle = (elapsed % 60) / 60  # 0 to 1
        # Peak usage during "business hours" (middle of cycle)
        load_multiplier = 0.7 + 0.6 * abs(2 * cycle - 1)  # Range: 0.7 to 1.3
        return load_multiplier
    
    def _add_random_jitter(self, base_value: float, variance: float = 0.15) -> float:
        """Add random variance to simulate realistic fluctuations"""
        jitter = random.uniform(1 - variance, 1 + variance)
        return base_value * jitter
    
    def get_namespace_usage(self) -> List[Dict[str, Any]]:
        """Generate realistic namespace-level metrics"""
        time_variance = self._get_time_variance()
        namespace_metrics = []
        
        for namespace, workloads in self.workloads.items():
            total_cpu = 0
            total_memory = 0
            
            for workload in workloads:
                # Calculate total for all replicas
                for _ in range(workload["replicas"]):
                    # Apply time-based variance and random jitter
                    cpu = self._add_random_jitter(
                        workload["cpu_base"] * time_variance,
                        variance=0.20
                    )
                    memory = self._add_random_jitter(
                        workload["mem_base"] * 1024 * 1024,  # Convert MB to bytes
                        variance=0.10
                    )
                    
                    total_cpu += cpu
                    total_memory += memory
            
            namespace_metrics.append({
                "namespace": namespace,
                "cpu_mcores": int(total_cpu),
                "memory_bytes": int(total_memory),
            })
        
        return namespace_metrics
    
    def get_pod_usage(self, namespace: str = None) -> List[Dict[str, Any]]:
        """Generate realistic pod-level metrics"""
        time_variance = self._get_time_variance()
        pod_metrics = []
        
        # Filter workloads by namespace if specified
        workloads_to_process = (
            {namespace: self.workloads[namespace]} if namespace and namespace in self.workloads
            else self.workloads
        )
        
        for ns, workloads in workloads_to_process.items():
            for workload in workloads:
                for replica in range(workload["replicas"]):
                    # Generate unique pod name
                    pod_suffix = ''.join(random.choices('abcdefghijklmnopqrstuvwxyz0123456789', k=10))
                    pod_name = f"{workload['name']}-{pod_suffix}"
                    
                    # Apply time-based variance and random jitter
                    cpu = self._add_random_jitter(
                        workload["cpu_base"] * time_variance,
                        variance=0.20
                    )
                    memory = self._add_random_jitter(
                        workload["mem_base"] * 1024 * 1024,  # Convert MB to bytes
                        variance=0.10
                    )
                    
                    pod_metrics.append({
                        "namespace": ns,
                        "pod": pod_name,
                        "cpu_mcores": int(cpu),
                        "memory_bytes": int(memory),
                    })
        
        return pod_metrics
    
    def get_cluster_info(self) -> Dict[str, Any]:
        """Return simulated cluster information"""
        return {
            "mode": "simulated",
            "cluster_name": "demo-cluster",
            "namespaces": list(self.workloads.keys()),
            "total_pods": sum(
                sum(w["replicas"] for w in workloads)
                for workloads in self.workloads.values()
            ),
            "uptime_seconds": int(time.time() - self.start_time),
        }
