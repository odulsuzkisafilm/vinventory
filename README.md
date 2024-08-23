# Vinventory

The project consists of 2 parts naturally: a backend server written in go and a web application written in React and Typescript (tsx).

# Vinventory API

## Overview

This is a server for managing virtual inventory.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Creating the Swagger Document](#creating-the-swagger-document)
- [Building the Project](#building-the-project)
- [Running the Server](#running-the-server)
- [Setting Up Cron Job](#setting-up-cron-job)
- [Swagger Documentation](#swagger-documentation)
- [Environment Variables](#environment-variables)

## Prerequisites

Ensure you have the following installed:
- Go (version 1.22 or higher)
- Git
- Cron
- Swag (for generating Swagger documentation)

## Getting Started

Clone the repository:

```bash
git clone https://gitlab.com/valensas/intern-projects/vinventory/backend.git
cd vinventory
```

## Creating the Swagger Document
```bash
swag init -g cmd/server/main.go
```

## Building the Project
```bash
go build -o vinventory cmd/server/main.go
```
This will create an executable file named vinventory in the project directory.

## Running the Server
To start the server, run:
```bash
./vinventory
```
The server will start on localhost:8080.

## Setting up the Cron Job
To set up a cron job to run the 'NotifyExpiringWarranties' job, follow these steps:
1. **Install and Start cron (needed for Linux systems, in Mac it comes preinstalled)**:
```bash
sudo apt update
sudo apt install cron

sudo systemctl start cron
sudo systemctl enable cron
```
2. **Open the crontab editor**:
```bash
crontab -e
```
3. **Add the following line to schedule the job to run every day at midnight**:
```bash
0 0 * * * cd path/to/parent/directory/of/binary/file && ./vinventory notification_job
```

## Swagger Documentation
Swagger documentation is available at http://localhost:8080/swagger/index.html.

## Environment Variables
### Variables Needed for the Program to Start (in .env):
- DB_HOST
- DB_PORT=8080
- DB_USER
- DB_PASSWORD
- DB_NAME
- AZURE_CLIENT_ID
- AZURE_TENANT_ID
- AZURE_CLIENT_SECRET

### Variables Needed for Notification Job (in .env):
- SMTP_HOST
- SMTP_PORT
- SMTP_USERNAME
- SMTP_PASSWORD
- SENDER_EMAIL
- RECEIVER_EMAIL


### Variables Needed for Minio Object Storage
- MINIO_ENDPOINT
- MINIO_ACCESS_KEY
- MINIO_SECRET_KEY
- MINIO_USE_SSL
- MINIO_BUCKET

### Variables Needed for Gorelease (.bashzrc or .zshrc):
- export GITLAB_TOKEN
- export DOCKER_USERNAME
#### - If Needed:
- export CC=gcc
- export CXX=g++
- export CGO_CFLAGS="-Wno-deprecated"
