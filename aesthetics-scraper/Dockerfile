FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY fetch_aesthetics.py .

ENV OUTPUT_DIR=/output

CMD ["python", "fetch_aesthetics.py"]