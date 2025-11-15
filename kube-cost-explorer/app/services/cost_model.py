from typing import Any, Dict, List

import yaml


class CostModel:
    def __init__(self, config_path: str = "config/cost_model.yaml"):
        self.config_path = config_path
        self.cost_config = self._load_cost_config()

    def _load_cost_config(self) -> Dict[str, Any]:
        """Load cost model configuration from YAML file"""
        try:
            with open(self.config_path, "r") as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            # Default configuration if file not found
            return {
                "currency": "USD",
                "cpu_per_core_hour": 0.031,
                "mem_per_gb_hour": 0.004,
            }

    def compute_cost(self, usage_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Compute cost for a list of usage data entries"""
        result = []

        for item in usage_data:
            # Calculate CPU core hours (convert millicores to cores)
            cpu_cores = item.get("cpu_mcores", 0) / 1000.0
            cpu_core_hours = cpu_cores  # Assuming we're calculating per hour

            # Calculate memory GB hours (convert bytes to GB)
            memory_gb = item.get("memory_bytes", 0) / (1024**3)
            memory_gb_hours = memory_gb  # Assuming we're calculating per hour

            # Calculate costs
            cpu_cost = cpu_core_hours * self.cost_config["cpu_per_core_hour"]
            memory_cost = memory_gb_hours * self.cost_config["mem_per_gb_hour"]
            hourly_cost = cpu_cost + memory_cost
            monthly_cost = hourly_cost * 730  # 730 hours in a month

            # Create result entry with original data plus computed costs
            result_item = item.copy()
            result_item.update(
                {
                    "cpu_core_hours": cpu_core_hours,
                    "memory_gb_hours": memory_gb_hours,
                    "hourly_cost": round(hourly_cost, 4),
                    "monthly_cost": round(monthly_cost, 2),
                }
            )

            result.append(result_item)

        return result
