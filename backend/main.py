from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from db import get_db_connection  # Import the DB connection function

# Initialize FastAPI app
app = FastAPI()

# Allow CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ API Endpoint for Fully Dynamic Filters
@app.get("/dynamic-filters")
def get_dynamic_filters(
    brand: str = Query(None),
    model: str = Query(None),
    year: int = Query(None),
    fuel_type: str = Query(None),
    hand_num: int = Query(None),
    magnesium_wheels: int = Query(None),
    distance_control: int = Query(None),
    economical: int = Query(None),
    adaptive_cruise_control: int = Query(None),
    cruise_control: int = Query(None),
    four_wheel_drive: int = Query(None),
    brand_group: str = Query(None)
):
    """
    Dynamically filters dropdown options based on selected filters.
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    filters = {
        "brand": brand,
        "model": model,
        "year": year,
        "fuel_type": fuel_type,
        "hand_num": hand_num,
        "magnesium_wheels": magnesium_wheels,
        "distance_control": distance_control,
        "economical": economical,
        "adaptive_cruise_control": adaptive_cruise_control,
        "cruise_control": cruise_control,
        "four_wheel_drive": four_wheel_drive,
        "brand_group": brand_group
    }

    query_conditions = []
    params = []

    for field, value in filters.items():
        if value is not None:
            query_conditions.append(f"{field} = %s")
            params.append(value)

    where_clause = "WHERE " + " AND ".join(query_conditions) if query_conditions else ""

    results = {}

    # Fetch valid dropdown options dynamically
    dropdown_columns = [
        "brand", "model", "year", "fuel_type", "hand_num", "brand_group",
        "magnesium_wheels", "distance_control", "economical",
        "adaptive_cruise_control", "cruise_control", "four_wheel_drive"
    ]

    for column in dropdown_columns:
        cursor.execute(f"SELECT DISTINCT {column} FROM cars {where_clause} ORDER BY {column}", tuple(params))
        results[column] = [row[column] for row in cursor.fetchall()]

    # Fetch min and max values for price
    cursor.execute(f"SELECT MIN(price) AS min, MAX(price) AS max FROM cars {where_clause}", tuple(params))
    row = cursor.fetchone()
    results["price"] = {"min": row["min"], "max": row["max"]}

    cursor.close()
    conn.close()

    return results

@app.get("/estimate-price")
def estimate_price(
    brand: str = Query(None),
    model: str = Query(None),
    year: int = Query(None),
    fuel_type: str = Query(None),
    hand_num: int = Query(None),
    magnesium_wheels: int = Query(None),
    distance_control: int = Query(None),
    economical: int = Query(None),
    adaptive_cruise_control: int = Query(None),
    cruise_control: int = Query(None),
    four_wheel_drive: int = Query(None),
    brand_group: str = Query(None),
    min_horse_power: float = Query(None),
    max_horse_power: float = Query(None),
    min_engine_volume: float = Query(None),
    max_engine_volume: float = Query(None)
):
    """
    Estimate the price range based on selected filters.
    Returns the min and max price from the filtered cars.
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    filters = {
        "brand": brand,
        "model": model,
        "year": year,
        "fuel_type": fuel_type,
        "hand_num": hand_num,
        "magnesium_wheels": magnesium_wheels,
        "distance_control": distance_control,
        "economical": economical,
        "adaptive_cruise_control": adaptive_cruise_control,
        "cruise_control": cruise_control,
        "four_wheel_drive": four_wheel_drive,
        "brand_group": brand_group,
        "horse_power >= ": min_horse_power,
        "horse_power <= ": max_horse_power,
        "engine_volume >= ": min_engine_volume,
        "engine_volume <= ": max_engine_volume
    }

    query_conditions = []
    params = []

    for field, value in filters.items():
        if value is not None:
            if field.strip().endswith(">=") or field.strip().endswith("<="):
                query_conditions.append(f"{field} %s")
            else:
                query_conditions.append(f"{field} = %s")
            params.append(value)

    where_clause = "WHERE " + " AND ".join(query_conditions) if query_conditions else ""

    query = f"""
        SELECT MIN(price) AS min_price, MAX(price) AS max_price 
        FROM cars {where_clause}
    """

    cursor.execute(query, tuple(params))
    result = cursor.fetchone()

    cursor.close()
    conn.close()

    # If no cars match the filters, return an error
    if result["min_price"] is None or result["max_price"] is None:
        return {"message": "No cars found matching the criteria."}

    return {
        "min_price": result["min_price"],
        "max_price": result["max_price"]
    }
