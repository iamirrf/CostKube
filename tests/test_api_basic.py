import pytest
from fastapi.testclient import TestClient

from app.main import app


# Create a fixture for the test client to avoid initialization issues
@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def test_api_config_endpoint(client):
    """Test the config API endpoint"""
    response = client.get("/api/config")
    assert response.status_code == 200

    data = response.json()
    assert "cost_config" in data
    assert "demo_mode" in data
    assert "k8s_available" in data
    assert isinstance(data["cost_config"], dict)
    assert isinstance(data["demo_mode"], bool)
    assert isinstance(data["k8s_available"], bool)


def test_api_namespaces_endpoint_demo_mode(client):
    """Test the namespaces API endpoint in demo mode"""
    response = client.get("/api/namespaces")
    assert response.status_code == 200

    data = response.json()
    assert "data" in data
    assert "demo_mode" in data
    assert isinstance(data["data"], list)
    assert isinstance(data["demo_mode"], bool)


def test_api_pods_endpoint_demo_mode(client):
    """Test the pods API endpoint in demo mode"""
    response = client.get("/api/pods")
    assert response.status_code == 200

    data = response.json()
    assert "data" in data
    assert "demo_mode" in data
    assert isinstance(data["data"], list)
    assert isinstance(data["demo_mode"], bool)


def test_api_pods_endpoint_with_namespace(client):
    """Test the pods API endpoint with namespace parameter"""
    response = client.get("/api/pods?namespace=default")
    assert response.status_code == 200

    data = response.json()
    assert "data" in data
    assert "demo_mode" in data
    assert isinstance(data["data"], list)
    assert isinstance(data["demo_mode"], bool)

    # If there are pods in the response, they should all be from the specified namespace
    for pod in data["data"]:
        assert pod["namespace"] == "default"
