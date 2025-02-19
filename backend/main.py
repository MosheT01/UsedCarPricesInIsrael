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

# ✅ Get all cars
@app.get("/cars")
def get_cars(brand: str = Query(None), year: int = Query(None), max_price: float = Query(None)):
    """
    Fetch cars from AWS RDS MySQL with optional filters: brand, year, max_price.
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

    if brand:
        query += " AND brand = %s"
        params.append(brand)
    if year:
        query += " AND year = %s"
        params.append(year)
    if max_price:
        query += " AND price <= %s"
        params.append(max_price)

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
