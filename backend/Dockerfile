FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Install Oracle Instant Client and dependencies
RUN apt-get update && apt-get install -y \
    libaio1 \
    wget \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Download and install Oracle Instant Client
RUN mkdir -p /opt/oracle \
    && cd /opt/oracle \
    && wget https://download.oracle.com/otn_software/linux/instantclient/211000/instantclient-basic-linux.x64-21.1.0.0.0.zip \
    && unzip instantclient-basic-linux.x64-21.1.0.0.0.zip \
    && rm instantclient-basic-linux.x64-21.1.0.0.0.zip \
    && cd /opt/oracle/instantclient_21_1 \
    && if [ ! -f libclntsh.so ]; then ln -s libclntsh.so.21.1 libclntsh.so; fi \
    && if [ ! -f libocci.so ]; then ln -s libocci.so.21.1 libocci.so; fi \
    && echo /opt/oracle/instantclient_21_1 > /etc/ld.so.conf.d/oracle-instantclient.conf \
    && ldconfig

# Install Python dependencies including cx_Oracle
WORKDIR /app
COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt

# Copy application code
COPY . .

# Copy the current directory contents into the container at /app
COPY . /app

# Make port 8000 available to the world outside this container
EXPOSE 8000

# Define environment variable
ENV LD_LIBRARY_PATH /opt/oracle/instantclient_21_1

# Run Gunicorn server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
