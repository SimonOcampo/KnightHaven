#!/bin/bash
# Start the KnightHaven server with proper environment variables

export DATABASE_URL="file:./prisma/dev.db"
node server.js
