FROM python:3.13-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libaio1 \
    wget \
    unzip \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . .

# Port
EXPOSE 8000

# Run Gunicorn server
CMD ["uvicorn", "serviceauth.asgi:application", "--bind", "0.0.0.0:8000"]
