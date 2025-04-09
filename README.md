# Exhibition Art Platform

A web application for browsing, creating, and experiencing art exhibitions in a virtual 3D environment.

## Features

- User authentication for artists, curators, and visitors
- Artwork upload and management
- Exhibition creation and curation
- 3D virtual gallery experience
- User profiles and social features

## Technology Stack

- **Frontend**: React with Next.js, Ant Design, Tailwind CSS
- **Backend**: Node.js with Express, TypeORM
- **Database**: PostgreSQL
- **Containerization**: Docker

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL (for local development)

## Deployment

### Using Docker Compose

The easiest way to deploy the application is using Docker Compose:

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/exhibitionSenior.git
   cd exhibitionSenior
   ```

2. Configure environment variables:
   - Copy `.env.example` to `.env` in both `frontend` and `backend` directories
   - Modify the environment variables as needed

3. Build and start the containers:
   ```bash
   docker-compose up -d
   ```

4. The application will be available at:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001/api

### Manual Deployment

#### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the application:
   ```bash
   npm run build
   ```

4. Start the server:
   ```bash
   npm start
   ```

#### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the application:
   ```bash
   npm run build
   ```

4. Start the server:
   ```bash
   npm start
   ```

## Development

### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

## Database Migrations

To create and run database migrations:

```bash
cd backend
npm run migration:generate -- MigrationName
npm run migration:run
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.