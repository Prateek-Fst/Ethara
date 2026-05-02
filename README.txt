================================================================
  TASKFLOW — TEAM TASK MANAGER (MERN STACK)
================================================================

A full-stack team task manager built with the MERN stack
(MongoDB, Express, React, Node.js) featuring authentication,
projects, role-based access control, a dashboard with stats
per user / overdue, and a drag-and-drop Kanban board.

----------------------------------------------------------------
  TECH STACK
----------------------------------------------------------------
Backend:   Node.js, Express, MongoDB (Mongoose), JWT, bcryptjs,
           express-validator
Frontend:  React 18, Vite, React Router v6, Axios, plain CSS,
           native HTML5 drag-and-drop (no extra DnD library)
Deploy:    Railway — single service serves API + React build

----------------------------------------------------------------
  FEATURES
----------------------------------------------------------------
Authentication
  - Signup with name / email / password (bcrypt + JWT)
  - Login with email + password
  - Persistent sessions (JWT in localStorage)
  - Server-side validation via express-validator
  - "First user becomes Admin" automatic promotion (see below)

Projects
  - Create / edit / delete projects
  - Project ownership (creator becomes both Owner AND Admin)
  - Add team members by email
  - Per-project roles: Admin / Member
  - Project status: Active / Completed / Archived
  - Progress bar based on completed tasks

Tasks
  - Title, description, priority (Low / Medium / High)
  - Status: Todo / In Progress / Done
  - Assign tasks to project members (validated)
  - Due dates with automatic overdue detection
  - 3-column Kanban board with DRAG-AND-DROP
  - Status dropdown still available as a fallback
  - Filter "My Tasks" by status & priority
  - Created / completed timestamps

Dashboard
  - Stat cards: total projects, total tasks, in-progress,
    completed, overdue, my open tasks
  - "Tasks per User" table (total, todo, in-progress, done,
    overdue per assignee)
  - "My Tasks" panel
  - Overdue list
  - Recent activity
  - Quick links to projects

Role-Based Access Control
  - Two role layers (see RBAC section below):
      Global role: Admin / Member (set automatically at signup)
      Project role: Admin / Member (per project)
  - All checks enforced server-side; UI only hides buttons
  - First signup becomes a global Admin; everyone else is
    a Member regardless of what the request body says

Validation & Error Handling
  - Server: express-validator on all input endpoints
  - Mongoose schema validation (length, required, enum)
  - Email uniqueness, password min length, etc.
  - Global error middleware catches unexpected errors
  - Client: required-field checks before submit

----------------------------------------------------------------
  HOW ROLES WORK
----------------------------------------------------------------
The app has TWO separate role concepts. This is intentional —
the assignment requires per-project Admin/Member, and we also
expose a "global" role for site-wide tagging.

1. GLOBAL ROLE (stored on the User document)
   - The very first user to sign up after the database is empty
     is automatically promoted to "Admin".
   - Everyone after that is "Member".
   - The signup endpoint IGNORES any role field sent in the
     request body — clients cannot self-promote.
   - Global role is shown in the navbar under your name.

   How to claim global Admin:
     a) Be the first to sign up on a fresh database, OR
     b) Wipe the DB (npm run db:reset -- --yes), then sign up,
        OR
     c) (Already-signed-up users) edit your user document in
        MongoDB Atlas → Browse Collections → users, change
        "role" from "Member" to "Admin", log out + back in.

2. PROJECT ROLE (per-project membership)
   - When you create a project, you become its OWNER and are
     auto-added to members[] with role: "Admin".
   - Owners + project Admins can: edit project, manage members,
     create/edit/delete any task in that project.
   - Project Members can: view, create tasks, change status of
     their own assigned tasks, edit/delete tasks they created.
   - Only the OWNER can delete the project itself.

----------------------------------------------------------------
  PERMISSIONS MATRIX (per-project actions)
----------------------------------------------------------------
                                Owner | Admin | Member | Outside
View project + tasks              Y     Y       Y         N
Create tasks                      Y     Y       Y         N
Edit task title/desc/due/priority Y     Y     own only    N
Reassign a task                   Y     Y       N         N
Change status of assigned task    Y     Y     own only    N
Delete a task                     Y     Y     own only    N
Add / remove members              Y     Y       N         N
Promote / demote a member         Y     Y       N         N
Edit project name/desc/status     Y     Y       N         N
Delete the project                Y     N       N         N

Notes:
- "own only" = the user is the task's createdBy or assignee
- Status drag-and-drop respects these rules — you can only
  drag a card if you have permission to change its status

GLOBAL admin/member (the navbar role) does not currently
override project-level permissions. To act on a project, you
must be a member of it.

----------------------------------------------------------------
  PROJECT STRUCTURE
----------------------------------------------------------------
Ethara/
  backend/                  Express + Mongoose API
    config/db.js            MongoDB connection
    models/                 User, Project, Task schemas
    middleware/             auth, projectAccess
    controllers/            Auth, Project, Task logic
    routes/                 /api/auth, /api/projects, /api/tasks
    scripts/resetDb.js      Clears every collection (guarded)
    server.js               Entry point + serves frontend dist
                            in production
    .env.example            Sample env vars
  frontend/                 React (Vite) SPA
    src/
      pages/                Login, Signup, Dashboard, Projects,
                            ProjectDetail, Tasks
      components/           Navbar, ProtectedRoute, TaskCard
      context/              AuthContext (login/signup/logout)
      api.js                Axios client w/ JWT interceptor
      styles.css            Modern UI styles
    vite.config.js          Dev proxy to /api → :5000
  railway.json              Railway build/start config
  Procfile                  Process spec for Railway
  package.json              Root scripts for monorepo
  README.txt                This file

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
                                          (incl. tasksPerUser)
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
1. Clone and install

   git clone <your-repo-url> taskflow
   cd taskflow
   npm run install-all

2. Configure environment

   cd backend
   cp .env.example .env
   # edit .env and set:
   #   MONGO_URI    your MongoDB connection string
   #   JWT_SECRET   long random string

3. Start the backend (terminal 1)

   cd backend
   npm run dev          # http://localhost:5000

4. Start the frontend (terminal 2)

   cd frontend
   npm run dev          # http://localhost:5173

5. Sign up — first user is automatically a global Admin.

----------------------------------------------------------------
  USEFUL SCRIPTS
----------------------------------------------------------------
From the project root:

  npm run install-all      Install backend + frontend deps
  npm run dev:backend      Run backend with nodemon
  npm run dev:frontend     Run Vite dev server
  npm run build            Build the React frontend
  npm start                Start the production backend
  npm run db:reset -- --yes
                           Empty every collection in the DB
                           (guarded — refuses without --yes)

The db:reset script reads MONGO_URI from backend/.env and
runs deleteMany({}) on every collection in the database.
It does NOT drop the database; collections remain (just
empty), so you can sign up immediately after to claim
global Admin again.

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

NEVER set PORT on Railway — Railway injects it automatically.

----------------------------------------------------------------
  DEPLOYMENT — RAILWAY
----------------------------------------------------------------
The app is configured to deploy as a SINGLE Railway service:
the Express server serves both the REST API and the built
React frontend. Frontend and backend share one origin, so
NO CORS configuration is needed.

1. Push this repository to GitHub.

2. Sign in to https://railway.app and click
   "New Project" → "Deploy from GitHub repo".
   Select your repository.

3. In the Railway service:
   Variables → Raw Editor (top-right), paste:

       MONGO_URI=mongodb+srv://USER:PASS@cluster.mongodb.net/taskmanager?retryWrites=true&w=majority
       JWT_SECRET=<long random string>
       JWT_EXPIRE=7d
       NODE_ENV=production

   Do NOT add PORT (Railway provides it).

4. MongoDB Atlas → Network Access → "+ Add IP Address" →
   "Allow Access from Anywhere" (0.0.0.0/0). Without this,
   even a correct URI cannot connect.

5. Railway reads railway.json and runs:
       Build:  npm install --prefix backend --include=dev
               npm install --prefix frontend --include=dev
               npm run build --prefix frontend
       Start:  npm start --prefix backend

   The --include=dev flag is needed because Railway sets
   NODE_ENV=production during builds, which would otherwise
   skip Vite (a build-time tool). All build deps are also
   listed under "dependencies" as a belt-and-braces measure.

6. Settings → Networking → Generate Domain.
   Open the generated URL. Sign up — you become the
   global Admin (assuming a fresh DB).

7. Verify:
       https://<domain>/api/health  →  {"status":"ok",...}
       https://<domain>/            →  TaskFlow signup page

8. (Optional) Use MongoDB Atlas:
     https://cloud.mongodb.com → free M0 cluster
     → Database Access: create a user
     → Network Access: 0.0.0.0/0
     → Connect → "Drivers" → copy URI
     → paste into Railway's MONGO_URI variable
     → make sure /taskmanager appears before the "?".

CORS / frontend env / redeploy:
  - No CORS config needed — same origin.
  - No frontend .env needed — api.js defaults to "/api"
    (relative path), which resolves to whatever domain
    serves the React app.
  - Editing Railway variables auto-restarts the service.
    No code push or manual redeploy needed for env changes.

----------------------------------------------------------------
  HOW IT WORKS — A QUICK TOUR
----------------------------------------------------------------
1. Sign up — first user becomes global Admin.
2. Create a Project — you become Owner + Project Admin.
3. Open the project → "Members" tab → add a teammate by
   their registered email. Pick role (Member or Admin).
4. Switch to the "Board" tab → "+ New Task". Set title,
   description, priority, due date, assignee.
5. Tasks appear in the Todo column.
   - DRAG cards between columns to change status, OR
   - Use the dropdown on each card. Both update the DB
     immediately (UI is optimistic; server rolls back if
     the user lacks permission).
6. "Dashboard" shows stat cards + per-user breakdown +
   overdue list. "My Tasks" shows tasks across every
   project assigned to you.

----------------------------------------------------------------
  SUBMISSION CHECKLIST
----------------------------------------------------------------
[X] Authentication (signup / login / JWT)
[X] Project & team management (add/remove members,
    Admin/Member roles)
[X] Task creation, assignment, status tracking
[X] Drag-and-drop Kanban board (Todo / In Progress / Done)
[X] Dashboard: total tasks / by status / per user / overdue
[X] REST APIs + MongoDB
[X] Validation (server + client)
[X] Relationships (User → Project → Task)
[X] Role-based access control (server-enforced)
[X] Frontend (React, responsive UI)
[X] Backend (Node + Express)
[X] Separate /backend and /frontend folders
[X] Railway deploy config (single service)
[X] No CORS / no frontend env vars required
[ ] Live URL              <-- add after deploying
[ ] GitHub repo URL       <-- add after pushing
[ ] 2-5 min demo video    <-- record full walkthrough

----------------------------------------------------------------
  LICENSE
----------------------------------------------------------------
MIT — feel free to use this as a starter for your own work.
