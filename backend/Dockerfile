# Use a smaller base image
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install dependencies early to cache them
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code last (so we don’t break the cache often)
COPY . .

# Expose port and run app
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
