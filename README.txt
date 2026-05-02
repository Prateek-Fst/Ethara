================================================================
  TASKFLOW — TEAM TASK MANAGER (MERN STACK)
================================================================

A full-stack team task manager built with the MERN stack
(MongoDB, Express, React, Node.js) featuring authentication,
projects, role-based access control, and a Kanban-style board.

----------------------------------------------------------------
  TECH STACK
----------------------------------------------------------------
Backend:    Node.js, Express, MongoDB (Mongoose), JWT, bcrypt,
            express-validator
Frontend:   React 18, Vite, React Router v6, Axios, plain CSS
Deploy:     Railway (single service serves API + built frontend)

----------------------------------------------------------------
  FEATURES
----------------------------------------------------------------
Authentication
  - Signup with name / email / password (bcrypt + JWT)
  - Login with email + password
  - Persistent sessions (JWT in localStorage)
  - First user to sign up automatically becomes a global Admin

Projects
  - Create, edit, delete projects
  - Project ownership (creator is the owner)
  - Add team members by email
  - Per-project roles: Admin / Member
  - Project status: Active / Completed / Archived
  - Progress bar based on completed tasks

Tasks
  - Title, description, priority (Low / Medium / High)
  - Status: Todo / In Progress / Done
  - Assign tasks to project members
  - Due dates with overdue detection
  - Kanban-style 3-column board view
  - Filter "My Tasks" by status & priority
  - Created-at / completed-at tracking

Dashboard
  - Stat cards: total projects, total tasks, in-progress,
    completed, overdue, my open tasks
  - "My Tasks" panel
  - Overdue list
  - Recent activity
  - Quick links to projects

Role-Based Access Control
  - Global role: Admin / Member (set at signup)
  - Project role: Admin / Member (per-project)
  - Project owner: only owner can delete project
  - Project Admin: edit project, add/remove members,
    change member roles, create/edit/delete any task
  - Project Member: view, create tasks, change status of
    own assigned tasks
  - Task assignee can change their task's status
  - Task creator can edit their own task

Validation
  - Server-side validation via express-validator
  - Mongoose schema validation (length, required, enum)
  - Email uniqueness, password min length, etc.
  - Client-side checks for required fields

----------------------------------------------------------------
  PROJECT STRUCTURE
----------------------------------------------------------------
Ethara/
  backend/                 Express + Mongoose API
    config/db.js           MongoDB connection
    models/                User, Project, Task schemas
    middleware/            auth, projectAccess
    controllers/           Auth, Project, Task logic
    routes/                /api/auth, /api/projects, /api/tasks
    server.js              Entry point (also serves frontend
                           build in production)
    .env.example           Sample env vars
  frontend/                React (Vite) SPA
    src/
      pages/               Login, Signup, Dashboard, Projects,
                           ProjectDetail, Tasks
      components/          Navbar, ProtectedRoute, TaskCard
      context/             AuthContext (login/signup/logout)
      api.js               Axios client w/ JWT interceptor
      styles.css           Modern UI styles
    vite.config.js         Dev proxy to /api -> :5000
  railway.json             Railway build/start config
  Procfile                 Process spec for Railway
  package.json             Root scripts for monorepo

----------------------------------------------------------------
  REST API
----------------------------------------------------------------
Auth
  POST   /api/auth/signup           { name, email, password }
  POST   /api/auth/login            { email, password }
  GET    /api/auth/me               (auth)  current user
  GET    /api/auth/users            (auth)  list users

Projects
  POST   /api/projects              (auth)  create
  GET    /api/projects              (auth)  list mine
  GET    /api/projects/:id          (auth)  get one
  PUT    /api/projects/:id          (admin) update
  DELETE /api/projects/:id          (owner) delete
  POST   /api/projects/:id/members  (admin) add member by email
  PUT    /api/projects/:id/members/:userId  (admin) change role
  DELETE /api/projects/:id/members/:userId  (admin) remove

Tasks
  GET    /api/tasks/dashboard       (auth)  dashboard data
  POST   /api/tasks                 (auth)  create
  GET    /api/tasks                 (auth)  list, filters:
                                       ?project=...
                                       ?status=...
                                       ?priority=...
                                       ?assignedTo=...
                                       ?mine=true
  GET    /api/tasks/:id             (auth)  get one
  PUT    /api/tasks/:id             (auth)  update*
  DELETE /api/tasks/:id             (auth)  delete*
  GET    /api/health                public  health check

  * Permissions enforced server-side. See RBAC section above.

----------------------------------------------------------------
  LOCAL DEVELOPMENT
----------------------------------------------------------------
1. Clone the repo and install deps

   git clone <your-repo-url> taskflow
   cd taskflow
   npm run install-all

2. Configure environment

   cd backend
   cp .env.example .env
   # edit .env and set MONGO_URI to your MongoDB connection
   # string and JWT_SECRET to a long random string

3. Start the backend (terminal 1)

   cd backend
   npm run dev
   # API listens on http://localhost:5000

4. Start the frontend (terminal 2)

   cd frontend
   npm run dev
   # App opens at http://localhost:5173
   # Vite proxies /api to http://localhost:5000

5. First user to sign up becomes a global Admin.

----------------------------------------------------------------
  ENVIRONMENT VARIABLES (backend/.env)
----------------------------------------------------------------
PORT          Port to listen on (Railway sets automatically)
MONGO_URI     MongoDB connection string (Atlas or local)
JWT_SECRET    Secret used to sign JWTs (long random string)
JWT_EXPIRE    Token lifetime (default 7d)
NODE_ENV      "development" or "production"
              In production, the backend also serves the
              built frontend from frontend/dist.

----------------------------------------------------------------
  DEPLOYMENT — RAILWAY
----------------------------------------------------------------
The app is configured to deploy as a SINGLE Railway service:
the Express server serves both the REST API and the built
React frontend.

1. Push this repository to GitHub.

2. Sign in to https://railway.app and click
   "New Project" -> "Deploy from GitHub repo".
   Select this repository.

3. In the Railway service:
   - Settings -> Variables, add:
       MONGO_URI    = <your MongoDB Atlas URI>
       JWT_SECRET   = <long random string>
       NODE_ENV     = production
       JWT_EXPIRE   = 7d
     (PORT is provided automatically by Railway.)

4. Railway will read railway.json and run:
       Build:  npm install --prefix backend
               npm install --prefix frontend
               npm run build --prefix frontend
       Start:  npm start --prefix backend

5. When the build finishes:
   - Settings -> Networking -> Generate Domain
   - Open the generated URL.
   - Sign up — the first account becomes a global Admin.

6. (Optional) Use MongoDB Atlas:
     https://cloud.mongodb.com -> create a free M0 cluster
     -> Database Access: create a user
     -> Network Access: allow 0.0.0.0/0 (or Railway IPs)
     -> Connect -> "Drivers" -> copy the URI
     -> paste into Railway's MONGO_URI variable
     -> append /taskmanager before the "?" so Mongoose
        creates the database on first write.

----------------------------------------------------------------
  HOW IT WORKS — A QUICK TOUR
----------------------------------------------------------------
1. Sign up — first user becomes global Admin.
2. Create a Project (you become the project Owner + Admin).
3. Open the project, go to "Members" tab, add a teammate
   by their registered email. Pick role (Member or Admin).
4. Go back to the "Board" tab, click "+ New Task".
   Set title, description, priority, due date, assignee.
5. Tasks appear in the Todo column. Drag-equivalent: use the
   status dropdown on each card to move between columns.
6. Visit "Dashboard" for an overview, or "My Tasks" to see
   all tasks assigned to you across every project.

----------------------------------------------------------------
  SUBMISSION CHECKLIST
----------------------------------------------------------------
[X] Authentication (signup / login / JWT)
[X] Project & team management
[X] Task creation, assignment, status tracking
[X] Dashboard (tasks / status / overdue)
[X] REST APIs + MongoDB
[X] Validation (server + client)
[X] Relationships (User -> Project -> Task)
[X] Role-based access control
[X] Frontend (React, responsive UI)
[X] Backend (Node + Express)
[X] Separate /backend and /frontend folders
[X] Railway deploy config
[ ] Live URL              <-- add after deploying
[ ] GitHub repo URL       <-- add after pushing
[ ] 2-5 min demo video    <-- record screen flow

----------------------------------------------------------------
  LICENSE
----------------------------------------------------------------
MIT — feel free to use this as a starter for your own work.
