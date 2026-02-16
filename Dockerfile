# Start with a tiny Linux
FROM python:3.9-alpine

# Install GCC (for C/C++) and other necessary tools
RUN apk add --no-cache build-base

# Set the working directory inside the container to /app
WORKDIR /app