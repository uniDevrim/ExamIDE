FROM python:3.9-slim

WORKDIR /app

# Copy your requirements (Flask, etc.)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your backend code
COPY . .

CMD ["python", "server.py"]