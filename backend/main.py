from fastapi import FastAPI, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from db import get_db_connection  # Import the DB connection function
from fastapi import Request, HTTPException

# Initialize FastAPI app
app = FastAPI()

# Allow only requests from the CloudFront domain
app.add_middleware(
    CORSMiddleware,
    #TODO: Update the allowed origins to only allow requests from the CloudFront domain
    # allow_origins=[
    # "https://d25vs314vmlkcr.cloudfront.net",
    # "https://ku55b83500.execute-api.eu-north-1.amazonaws.com"
    # ,"*"# TODO: Update this to only allow requests from the CloudFront domain
    # ],
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]  # Ensures CORS headers are properly forwarded
)


# ✅ API Endpoint for Fully Dynamic Filters
@app.get("/api/dynamic-filters")
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

@app.get("/api/estimate-price")
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

# ✅ API Endpoint for to check the health of the API
@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

# Catch-all route to handle all /api/* requests dynamically
@app.api_route("/api/{proxy+}", methods=["GET", "POST", "PUT", "DELETE"])
async def catch_all(request: Request):
    return {"message": f"Handled route {request.url.path}"}

#TODO: uncomment below code restrict requests to only come from the CloudFront domain
@app.middleware("http")
async def restrict_to_cloudfront(request: Request, call_next):
    allowed_origins = [
        "https://d25vs314vmlkcr.cloudfront.net",
        "https://ku55b83500.execute-api.eu-north-1.amazonaws.com"
    ]
    origin = request.headers.get("origin")

    if origin and origin not in allowed_origins:
        raise HTTPException(status_code=403, detail="Forbidden: Requests must come from an allowed origin.")

    response = await call_next(request)
    return response


# --- Appended Code for Yearly Average Price Endpoint ---
@app.get("/api/average-price-yearly")
def average_price_yearly(
    brand: str = Query(...),  # Require brand parameter
    model: str = Query(...)   # Require model parameter
):
    """
    Returns the average price for each year for the selected car brand and model.
    """
    conn = get_db_connection()                  # Get database connection
    cursor = conn.cursor(dictionary=True)       # Create cursor for dict results

    # SQL: Group by year for the chosen brand and model
    query = """
        SELECT year, AVG(price) as avg_price
        FROM cars
        WHERE brand = %s AND model = %s
        GROUP BY year
        ORDER BY year
    """
    cursor.execute(query, (brand, model))        # Execute query with brand and model
    rows = cursor.fetchall()                      # Fetch all rows
    cursor.close()                                # Close cursor
    conn.close()                                  # Close connection

    if not rows:
        return {"message": "No data found for the selected car brand and model."}
    return {"data": rows}                         # Return the yearly averages

# New endpoint to handle combined search queries for car details
@app.get("/api/search-car")
def search_car(brand: str = Query(...), model: str = Query(...)):
    """
    Returns detailed car data including estimated price range and yearly average prices
    for the specified car brand and model.
    """
    conn = get_db_connection()                  # Get database connection
    cursor = conn.cursor(dictionary=True)       # Create a cursor that returns dictionaries

    # Get estimated price range for the car
    query_estimate = "SELECT MIN(price) AS min_price, MAX(price) AS max_price FROM cars WHERE brand = %s AND model = %s"
    cursor.execute(query_estimate, (brand, model))
    estimate = cursor.fetchone()

    # Get yearly average prices for the car
    query_yearly = "SELECT year, AVG(price) as avg_price FROM cars WHERE brand = %s AND model = %s GROUP BY year ORDER BY year"
    cursor.execute(query_yearly, (brand, model))
    yearly = cursor.fetchall()

    cursor.close()                              # Close the cursor
    conn.close()                                # Close the database connection

    # If no matching car is found, return a message
    if estimate["min_price"] is None or estimate["max_price"] is None:
        return {"message": "No cars found matching the criteria."}

    # Return both estimate and yearly data
    return {
        "estimate": estimate,
        "yearly": yearly
    }
