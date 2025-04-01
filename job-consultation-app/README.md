# Job Consultation App

A platform for connecting buyers with sellers for professional job consultations.

## Features

- User authentication with email/password and 42 OAuth
- User profiles with expertise and bio
- Market for job requests
- Messaging system between users
- Job assignment and completion tracking

## Tech Stack

- **Frontend**: Angular 17, Ionic Framework, Capacitor
- **Backend**: Express.js, MongoDB
- **Authentication**: JWT

## Project Setup

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Angular CLI

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd job-consultation-app
```

2. Install dependencies
```bash
npm install
```

3. Configure environment
- Create a `.env` file in the backend directory with the following variables:
```
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb://localhost:27017/job-consultation
JWT_SECRET=your_secret_key
```

4. Run the application
- Development mode (both frontend and backend):
```bash
npm run dev
```

- Frontend only:
```bash
npm start
```

- Backend only:
```bash
npm run server
```

### Build for production
```bash
npm run build
```

## Project Structure

- `/src`: Angular application
  - `/app`: Core application code
    - `/components`: Reusable UI components
    - `/pages`: Application pages
    - `/services`: Business logic and API calls
    - `/guards`: Route guards
    - `/models`: Data models/interfaces
  - `/assets`: Static assets
  - `/environments`: Environment configurations

- `/backend`: Express.js backend
  - `/middleware`: Custom middleware
  - `/models`: MongoDB models
  - `/routes`: API routes
  - `server.js`: Main server file

## API Endpoints

### Authentication
- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Login with email/password
- `POST /api/auth/42`: Login with 42 OAuth
- `GET /api/auth/user`: Get authenticated user data

### Users
- `GET /api/users/profile`: Get current user's profile
- `POST /api/users/profile`: Create or update user profile
- `GET /api/users/profile/:userId`: Get profile by user ID
- `GET /api/users/sellers`: Get all sellers' profiles

### Jobs
- `POST /api/jobs`: Create a new job request
- `GET /api/jobs`: Get all jobs relevant to the user
- `GET /api/jobs/:id`: Get job by ID
- `PUT /api/jobs/:id/assign`: Assign a job to a seller
- `PUT /api/jobs/:id/complete`: Mark a job as completed

### Messages
- `POST /api/messages`: Send a message
- `GET /api/messages`: Get all messages for a user (conversations)
- `GET /api/messages/:userId`: Get messages between current user and another user
- `PUT /api/messages/read/:userId`: Mark messages from a user as read
- `GET /api/messages/unread/count`: Get count of unread messages
