from app.services.cost_model import CostModel


def test_cost_model_computation():
    """Test the cost model computation with known values"""
    cost_model = CostModel()

    # Test data with known values
    test_data = [
        {
            "namespace": "test-namespace",
            "cpu_mcores": 100,  # 1 core
            "memory_bytes": 1073741824,  # 1 GiB
        }
    ]

    # Calculate expected values
    # CPU: 100 millicores = 0.1 core * $0.031 per core-hour = $0.0031
    # Memory: 1 GiB * $0.004 per GB-hour = $0.004
    # Total: $0.0071 per hour
    # Monthly: $0.0071 * 730 = $5.183
    expected_cpu_core_hours = 100 / 1000.0  # 0.1 cores
    expected_memory_gb_hours = 1073741824 / (1024**3)  # 1 GiB
    expected_hourly_cost = (expected_cpu_core_hours * 0.031) + (
        expected_memory_gb_hours * 0.004
    )  # $0.0071
    expected_monthly_cost = expected_hourly_cost * 730  # $5.183

    result = cost_model.compute_cost(test_data)

    assert len(result) == 1
    assert result[0]["namespace"] == "test-namespace"
    assert result[0]["cpu_mcores"] == 100
    assert result[0]["memory_bytes"] == 1073741824
    assert result[0]["cpu_core_hours"] == expected_cpu_core_hours
    assert result[0]["memory_gb_hours"] == expected_memory_gb_hours
    assert abs(result[0]["hourly_cost"] - expected_hourly_cost) < 0.001
    assert abs(result[0]["monthly_cost"] - expected_monthly_cost) < 0.01


def test_cost_model_computation_zero_values():
    """Test the cost model computation with zero values"""
    cost_model = CostModel()

    test_data = [{"namespace": "empty-namespace", "cpu_mcores": 0, "memory_bytes": 0}]

    result = cost_model.compute_cost(test_data)

    assert len(result) == 1
    assert result[0]["namespace"] == "empty-namespace"
    assert result[0]["cpu_mcores"] == 0
    assert result[0]["memory_bytes"] == 0
    assert result[0]["cpu_core_hours"] == 0.0
    assert result[0]["memory_gb_hours"] == 0.0
    assert result[0]["hourly_cost"] == 0.0
    assert result[0]["monthly_cost"] == 0.0


def test_cost_model_multiple_items():
    """Test the cost model computation with multiple items"""
    cost_model = CostModel()

    test_data = [
        {
            "namespace": "namespace-1",
            "cpu_mcores": 500,  # 0.5 cores
            "memory_bytes": 536870912,  # 0.5 GiB
        },
        {
            "namespace": "namespace-2",
            "cpu_mcores": 2000,  # 2 cores
            "memory_bytes": 2147483648,  # 2 GiB
        },
    ]

    result = cost_model.compute_cost(test_data)

    assert len(result) == 2
    assert result[0]["namespace"] == "namespace-1"
    assert result[1]["namespace"] == "namespace-2"

    # Check first namespace costs
    expected_hourly_1 = (0.5 * 0.031) + (0.5 * 0.004)  # $0.0175
    expected_monthly_1 = expected_hourly_1 * 730  # $12.775
    assert abs(result[0]["hourly_cost"] - expected_hourly_1) < 0.001
    assert abs(result[0]["monthly_cost"] - expected_monthly_1) < 0.01

    # Check second namespace costs
    expected_hourly_2 = (2.0 * 0.031) + (2.0 * 0.004)  # $0.07
    expected_monthly_2 = expected_hourly_2 * 730  # $51.1
    assert abs(result[1]["hourly_cost"] - expected_hourly_2) < 0.001
    assert abs(result[1]["monthly_cost"] - expected_monthly_2) < 0.01
