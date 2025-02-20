from fastapi import FastAPI, HTTPException, Query
import mysql.connector
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize FastAPI app
app = FastAPI()

# Function to connect to AWS RDS MySQL
def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME")
    )

# ✅ Home route
@app.get("/")
def home():
    return {"message": "🚀 FastAPI is running!"}

# ✅ Get all cars with full filtering support
@app.get("/cars")
def get_cars(
    brand: str = Query(None, description="Filter by car brand"),
    model: str = Query(None, description="Filter by car model"),
    year: int = Query(None, description="Filter by car year"),
    min_price: float = Query(None, description="Filter by minimum price"),
    max_price: float = Query(None, description="Filter by maximum price"),
    min_horse_power: float = Query(None, description="Filter by minimum horsepower"),
    max_horse_power: float = Query(None, description="Filter by maximum horsepower"),
    min_engine_volume: float = Query(None, description="Filter by minimum engine volume"),
    max_engine_volume: float = Query(None, description="Filter by maximum engine volume"),
    fuel_type: str = Query(None, description="Filter by fuel type"),
    magnesium_wheels: int = Query(None, description="Filter by presence of magnesium wheels (0/1)"),
    distance_control: int = Query(None, description="Filter by presence of distance control (0/1)"),
    economical: int = Query(None, description="Filter by economical car (0/1)"),
    adaptive_cruise_control: int = Query(None, description="Filter by adaptive cruise control (0/1)"),
    cruise_control: int = Query(None, description="Filter by cruise control (0/1)"),
    four_wheel_drive: int = Query(None, description="Filter by four-wheel drive (0/1)"),
    brand_group: str = Query(None, description="Filter by brand group (Luxury, Budget, Other)")
):
    """
    Fetch cars from AWS RDS MySQL with filtering on multiple attributes.
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    query = """
        SELECT id, brand, model, year, hand_num, horse_power, engine_volume, 
               fuel_type, car_age, price, magnesium_wheels, distance_control, 
               economical, adaptive_cruise_control, cruise_control, four_wheel_drive, brand_group
        FROM cars WHERE 1=1
    """
    params = []

    # Add filters dynamically based on query parameters
    if brand:
        query += " AND brand = %s"
        params.append(brand)
    if model:
        query += " AND model = %s"
        params.append(model)
    if year:
        query += " AND year = %s"
        params.append(year)
    if min_price:
        query += " AND price >= %s"
        params.append(min_price)
    if max_price:
        query += " AND price <= %s"
        params.append(max_price)
    if min_horse_power:
        query += " AND horse_power >= %s"
        params.append(min_horse_power)
    if max_horse_power:
        query += " AND horse_power <= %s"
        params.append(max_horse_power)
    if min_engine_volume:
        query += " AND engine_volume >= %s"
        params.append(min_engine_volume)
    if max_engine_volume:
        query += " AND engine_volume <= %s"
        params.append(max_engine_volume)
    if fuel_type:
        query += " AND fuel_type = %s"
        params.append(fuel_type)
    if magnesium_wheels is not None:
        query += " AND magnesium_wheels = %s"
        params.append(magnesium_wheels)
    if distance_control is not None:
        query += " AND distance_control = %s"
        params.append(distance_control)
    if economical is not None:
        query += " AND economical = %s"
        params.append(economical)
    if adaptive_cruise_control is not None:
        query += " AND adaptive_cruise_control = %s"
        params.append(adaptive_cruise_control)
    if cruise_control is not None:
        query += " AND cruise_control = %s"
        params.append(cruise_control)
    if four_wheel_drive is not None:
        query += " AND four_wheel_drive = %s"
        params.append(four_wheel_drive)
    if brand_group:
        query += " AND brand_group = %s"
        params.append(brand_group)

    cursor.execute(query, tuple(params))
    cars = cursor.fetchall()

    cursor.close()
    conn.close()

    if not cars:
        raise HTTPException(status_code=404, detail="No cars found matching the criteria.")

    return {"cars": cars}

# ✅ Get car by ID
@app.get("/cars/{car_id}")
def get_car_by_id(car_id: int):
    """
    Fetch a single car by its ID.
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM cars WHERE id = %s", (car_id,))
    car = cursor.fetchone()

    cursor.close()
    conn.close()

    if not car:
        raise HTTPException(status_code=404, detail="Car not found")

    return {"car": car}
