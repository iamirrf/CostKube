import json
from typing import Any, Dict, List


class DemoData:
    def __init__(self, demo_data_path: str = "sample_data/demo_metrics.json"):
        self.demo_data_path = demo_data_path
        self.demo_data = self._load_demo_data()

    def _load_demo_data(self) -> Dict[str, Any]:
        """Load demo data from JSON file"""
        try:
            with open(self.demo_data_path, "r") as f:
                return json.load(f)
        except FileNotFoundError:
            # Return empty data if file not found
            return {"namespaces": [], "pods": []}

    def get_namespace_usage(self) -> List[Dict[str, Any]]:
        """Get demo namespace usage data"""
        return self.demo_data.get("namespaces", [])

    def get_pod_usage(self) -> List[Dict[str, Any]]:
        """Get demo pod usage data"""
        return self.demo_data.get("pods", [])
