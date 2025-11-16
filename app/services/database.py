"""
Database service for storing historical metrics data
"""
import aiosqlite
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from pathlib import Path


class DatabaseService:
    def __init__(self, db_path: str = "data/costkube.db"):
        self.db_path = db_path
        # Ensure data directory exists
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)

    async def initialize(self):
        """Initialize database and create tables if they don't exist"""
        async with aiosqlite.connect(self.db_path) as db:
            # Create namespace metrics table
            await db.execute(
                """
                CREATE TABLE IF NOT EXISTS namespace_metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    namespace TEXT NOT NULL,
                    cpu_mcores REAL NOT NULL,
                    memory_bytes REAL NOT NULL,
                    hourly_cost REAL NOT NULL,
                    monthly_cost REAL NOT NULL
                )
            """
            )

            # Create pod metrics table
            await db.execute(
                """
                CREATE TABLE IF NOT EXISTS pod_metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    namespace TEXT NOT NULL,
                    pod TEXT NOT NULL,
                    cpu_mcores REAL NOT NULL,
                    memory_bytes REAL NOT NULL,
                    hourly_cost REAL NOT NULL,
                    monthly_cost REAL NOT NULL
                )
            """
            )

            # Create indexes for better query performance
            await db.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_namespace_metrics_timestamp
                ON namespace_metrics(timestamp DESC)
            """
            )
            await db.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_namespace_metrics_namespace
                ON namespace_metrics(namespace)
            """
            )
            await db.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_pod_metrics_timestamp
                ON pod_metrics(timestamp DESC)
            """
            )
            await db.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_pod_metrics_namespace
                ON pod_metrics(namespace)
            """
            )

            await db.commit()

    async def save_namespace_metrics(self, metrics: List[Dict[str, Any]]):
        """Save namespace metrics snapshot"""
        async with aiosqlite.connect(self.db_path) as db:
            for metric in metrics:
                await db.execute(
                    """
                    INSERT INTO namespace_metrics
                    (namespace, cpu_mcores, memory_bytes, hourly_cost, monthly_cost)
                    VALUES (?, ?, ?, ?, ?)
                """,
                    (
                        metric["namespace"],
                        metric["cpu_mcores"],
                        metric["memory_bytes"],
                        metric["hourly_cost"],
                        metric["monthly_cost"],
                    ),
                )
            await db.commit()

    async def save_pod_metrics(self, metrics: List[Dict[str, Any]]):
        """Save pod metrics snapshot"""
        async with aiosqlite.connect(self.db_path) as db:
            for metric in metrics:
                await db.execute(
                    """
                    INSERT INTO pod_metrics
                    (namespace, pod, cpu_mcores, memory_bytes, hourly_cost, monthly_cost)
                    VALUES (?, ?, ?, ?, ?, ?)
                """,
                    (
                        metric["namespace"],
                        metric["pod"],
                        metric["cpu_mcores"],
                        metric["memory_bytes"],
                        metric["hourly_cost"],
                        metric["monthly_cost"],
                    ),
                )
            await db.commit()

    async def get_namespace_history(
        self, namespace: Optional[str] = None, hours: int = 24
    ) -> List[Dict[str, Any]]:
        """Get historical namespace metrics"""
        since = datetime.now() - timedelta(hours=hours)

        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row

            if namespace:
                query = """
                    SELECT * FROM namespace_metrics
                    WHERE namespace = ? AND timestamp >= ?
                    ORDER BY timestamp ASC
                """
                cursor = await db.execute(query, (namespace, since))
            else:
                query = """
                    SELECT * FROM namespace_metrics
                    WHERE timestamp >= ?
                    ORDER BY timestamp ASC
                """
                cursor = await db.execute(query, (since,))

            rows = await cursor.fetchall()
            return [dict(row) for row in rows]

    async def get_cost_trends(self, hours: int = 168) -> Dict[str, Any]:
        """Get cost trend data for charts (default: 7 days)"""
        since = datetime.now() - timedelta(hours=hours)

        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row

            # Get hourly aggregated costs
            query = """
                SELECT
                    datetime(timestamp, 'start of hour') as hour,
                    SUM(hourly_cost) as total_cost,
                    SUM(cpu_mcores) as total_cpu,
                    SUM(memory_bytes) as total_memory
                FROM namespace_metrics
                WHERE timestamp >= ?
                GROUP BY hour
                ORDER BY hour ASC
            """
            cursor = await db.execute(query, (since,))
            rows = await cursor.fetchall()

            return {
                "timestamps": [row["hour"] for row in rows],
                "costs": [row["total_cost"] for row in rows],
                "cpu": [row["total_cpu"] for row in rows],
                "memory": [row["total_memory"] for row in rows],
            }

    async def get_top_namespaces(
        self, limit: int = 10, hours: int = 24
    ) -> List[Dict[str, Any]]:
        """Get top namespaces by cost"""
        since = datetime.now() - timedelta(hours=hours)

        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row

            query = """
                SELECT
                    namespace,
                    AVG(hourly_cost) as avg_hourly_cost,
                    AVG(monthly_cost) as avg_monthly_cost,
                    AVG(cpu_mcores) as avg_cpu,
                    AVG(memory_bytes) as avg_memory
                FROM namespace_metrics
                WHERE timestamp >= ?
                GROUP BY namespace
                ORDER BY avg_monthly_cost DESC
                LIMIT ?
            """
            cursor = await db.execute(query, (since, limit))
            rows = await cursor.fetchall()

            return [dict(row) for row in rows]

    async def cleanup_old_data(self, days: int = 30):
        """Clean up data older than specified days"""
        cutoff = datetime.now() - timedelta(days=days)

        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                "DELETE FROM namespace_metrics WHERE timestamp < ?", (cutoff,)
            )
            await db.execute("DELETE FROM pod_metrics WHERE timestamp < ?", (cutoff,))
            await db.commit()


# Global database instance
db_service = DatabaseService()
