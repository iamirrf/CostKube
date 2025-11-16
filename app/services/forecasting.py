"""
Cost forecasting and prediction service using simple linear regression
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import numpy as np
from sklearn.linear_model import LinearRegression


class ForecastService:
    def __init__(self):
        self.model = LinearRegression()

    def forecast_costs(
        self, historical_data: List[Dict[str, Any]], forecast_days: int = 30
    ) -> Dict[str, Any]:
        """
        Forecast future costs based on historical data

        Args:
            historical_data: List of historical cost data points with timestamp and cost
            forecast_days: Number of days to forecast into the future

        Returns:
            Dictionary with forecast data and statistics
        """
        if len(historical_data) < 7:  # Need at least a week of data
            return {
                "error": "Insufficient historical data for forecasting. Need at least 7 days.",
                "min_data_points": 7,
                "current_data_points": len(historical_data),
            }

        # Prepare data for linear regression
        timestamps = []
        costs = []

        for entry in historical_data:
            if isinstance(entry.get("timestamp"), str):
                ts = datetime.fromisoformat(entry["timestamp"].replace("Z", "+00:00"))
            else:
                ts = entry.get("timestamp", datetime.now())

            # Convert to hours since epoch for better numerical stability
            hours_since_epoch = ts.timestamp() / 3600
            timestamps.append(hours_since_epoch)
            costs.append(entry.get("total_cost", entry.get("hourly_cost", 0)))

        X = np.array(timestamps).reshape(-1, 1)
        y = np.array(costs)

        # Fit the model
        self.model.fit(X, y)

        # Calculate statistics
        mean_cost = np.mean(costs)
        std_cost = np.std(costs)
        trend_slope = self.model.coef_[0]

        # Determine trend direction
        if abs(trend_slope) < mean_cost * 0.001:  # Less than 0.1% change per hour
            trend = "stable"
        elif trend_slope > 0:
            trend = "increasing"
        else:
            trend = "decreasing"

        # Generate forecast
        last_timestamp = timestamps[-1]
        forecast_timestamps = []
        forecast_costs = []
        forecast_dates = []

        for day in range(1, forecast_days + 1):
            future_hour = last_timestamp + (day * 24)
            forecast_cost = self.model.predict([[future_hour]])[0]

            # Don't allow negative forecasts
            forecast_cost = max(0, forecast_cost)

            forecast_timestamps.append(future_hour)
            forecast_costs.append(float(forecast_cost))

            # Calculate the actual date
            future_date = datetime.fromtimestamp(future_hour * 3600)
            forecast_dates.append(future_date.isoformat())

        # Calculate monthly forecast (30 days)
        total_forecast_monthly = (
            sum(forecast_costs[:30]) * 24
        )  # Convert daily to monthly

        # Calculate confidence interval (simple approach using std dev)
        lower_bound = [max(0, cost - std_cost) for cost in forecast_costs]
        upper_bound = [cost + std_cost for cost in forecast_costs]

        return {
            "forecast_days": forecast_days,
            "forecast_dates": forecast_dates,
            "forecast_costs": forecast_costs,
            "forecast_monthly_total": float(total_forecast_monthly),
            "lower_bound": lower_bound,
            "upper_bound": upper_bound,
            "current_monthly_cost": float(
                mean_cost * 730
            ),  # Approximate monthly from hourly
            "trend": trend,
            "trend_slope": float(trend_slope),
            "daily_change_rate": float(trend_slope * 24),
            "mean_historical_cost": float(mean_cost),
            "std_dev": float(std_cost),
            "data_points_used": len(historical_data),
            "timestamp": datetime.now().isoformat(),
        }

    def predict_budget_runway(
        self, historical_data: List[Dict[str, Any]], budget: float
    ) -> Dict[str, Any]:
        """
        Predict when budget will be exhausted based on current trends

        Args:
            historical_data: Historical cost data
            budget: Remaining budget

        Returns:
            Budget runway prediction
        """
        if len(historical_data) < 7:
            return {
                "error": "Insufficient data for budget prediction",
                "min_data_points": 7,
            }

        # Get forecast for next 365 days
        forecast = self.forecast_costs(historical_data, forecast_days=365)

        if "error" in forecast:
            return forecast

        # Calculate cumulative costs
        cumulative_cost = 0
        days_until_exhaustion = None
        exhaustion_date = None

        for day, daily_cost in enumerate(forecast["forecast_costs"], start=1):
            cumulative_cost += daily_cost * 24  # Convert hourly to daily

            if cumulative_cost >= budget:
                days_until_exhaustion = day
                exhaustion_date = forecast["forecast_dates"][day - 1]
                break

        if days_until_exhaustion is None:
            # Budget lasts more than a year
            days_until_exhaustion = 365
            exhaustion_date = forecast["forecast_dates"][-1]
            sufficient = True
        else:
            sufficient = False

        return {
            "budget": budget,
            "days_until_exhaustion": days_until_exhaustion,
            "exhaustion_date": exhaustion_date,
            "sufficient_for_year": sufficient,
            "current_monthly_burn_rate": forecast["current_monthly_cost"],
            "projected_monthly_burn_rate": forecast["forecast_monthly_total"],
            "trend": forecast["trend"],
            "recommendation": self._get_budget_recommendation(
                days_until_exhaustion, forecast["trend"]
            ),
        }

    def _get_budget_recommendation(self, days: int, trend: str) -> str:
        """Generate budget recommendation based on runway"""
        if days > 180:
            return f"Budget is healthy. Runway exceeds 6 months ({days} days)."
        elif days > 90:
            return (
                f"Budget runway is {days} days. Consider planning for the next quarter."
            )
        elif days > 30:
            return f"⚠️ Budget runway is {days} days. Start planning cost optimization now!"
        else:
            return f"🚨 Critical: Budget will be exhausted in {days} days! Immediate action required."

    def seasonal_analysis(
        self, historical_data: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Analyze seasonal patterns in cost data

        Args:
            historical_data: Historical cost data with timestamps

        Returns:
            Seasonal analysis results
        """
        if len(historical_data) < 30:  # Need at least a month
            return {
                "error": "Need at least 30 days of data for seasonal analysis",
                "current_data_points": len(historical_data),
            }

        # Group by day of week
        day_of_week_costs = {i: [] for i in range(7)}  # 0=Monday, 6=Sunday
        hour_of_day_costs = {i: [] for i in range(24)}

        for entry in historical_data:
            if isinstance(entry.get("timestamp"), str):
                ts = datetime.fromisoformat(entry["timestamp"].replace("Z", "+00:00"))
            else:
                ts = entry.get("timestamp", datetime.now())

            day_of_week = ts.weekday()
            hour_of_day = ts.hour
            cost = entry.get("total_cost", entry.get("hourly_cost", 0))

            day_of_week_costs[day_of_week].append(cost)
            hour_of_day_costs[hour_of_day].append(cost)

        # Calculate averages
        day_names = [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
        ]
        day_averages = {
            day_names[day]: float(np.mean(costs)) if costs else 0
            for day, costs in day_of_week_costs.items()
        }

        hour_averages = {
            f"{hour:02d}:00": float(np.mean(costs)) if costs else 0
            for hour, costs in hour_of_day_costs.items()
        }

        # Find peak and low times
        peak_day = max(day_averages, key=day_averages.get)
        low_day = min(day_averages, key=day_averages.get)
        peak_hour = max(hour_averages, key=hour_averages.get)
        low_hour = min(hour_averages, key=hour_averages.get)

        return {
            "day_of_week_averages": day_averages,
            "hour_of_day_averages": hour_averages,
            "peak_day": peak_day,
            "peak_day_cost": day_averages[peak_day],
            "low_day": low_day,
            "low_day_cost": day_averages[low_day],
            "peak_hour": peak_hour,
            "peak_hour_cost": hour_averages[peak_hour],
            "low_hour": low_hour,
            "low_hour_cost": hour_averages[low_hour],
            "weekend_avg": float(
                np.mean([day_averages["Saturday"], day_averages["Sunday"]])
            ),
            "weekday_avg": float(np.mean([day_averages[day] for day in day_names[:5]])),
        }


# Global forecast service instance
forecast_service = ForecastService()
