# Use the official Python image
FROM python:3.10-slim

# Set the working directory inside the container
WORKDIR /backend

# Copy the requirements file first (for caching)
COPY requirements.txt .

# Install the Python dependencies with pip upgrade to avoid PyPI index bugs
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the rest of your FastAPI application code
COPY . ./app

# Expose the port FastAPI runs on
EXPOSE 8000

# Start the FastAPI server with auto-reload
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
