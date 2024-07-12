#!/bin/sh

# Apply Prisma migrations and start the application
npx prisma migrate deploy

# Create the Prisma Client
npx prisma generate

# Run the main container command
exec "$@"