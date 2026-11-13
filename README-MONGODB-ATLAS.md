# MongoDB Atlas configuration

1. In Atlas, create a database user with read/write access to the `pulseops` database.
2. Add your development machine's public IP to Atlas Network Access.
3. Copy `.env.example` to `.env` in the project root.
4. Set `MONGODB_URI` to the Atlas connection string, with database name `pulseops`.
5. URL-encode reserved characters in the database password.
6. Keep `.env` private and never include it in a shared ZIP or Git repository.

The application connects to MongoDB before starting its HTTP server. Mongoose creates collections when records are first inserted. See `README.md` for full startup instructions.
