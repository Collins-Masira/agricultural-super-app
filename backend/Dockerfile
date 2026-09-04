FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev curl && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /app/instance/uploads

EXPOSE 8000

ENV FLASK_APP=wsgi.py

CMD ["gunicorn", "wsgi:app", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120"]
