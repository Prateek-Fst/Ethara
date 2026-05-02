================================================================
  TASKFLOW — TEAM TASK MANAGER (MERN STACK)
================================================================

A full-stack team task manager built with MongoDB, Express,
React, and Node.js. Features authentication, projects,
three-tier role-based access control, a per-user dashboard,
and a drag-and-drop Kanban board. Deploys as a single
Railway service.

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
  - First user to sign up is automatically promoted to global
    Admin. Every signup after that is a Member regardless of
    what the request body says (privilege-escalation safe).

Projects
  - Create / edit / delete projects
  - Project Owner (creator) is auto-added as project Admin
  - Add team members by email; per-project roles (Admin/Member)
  - Project status: Active / Completed / Archived
  - Per-project completion progress bar

Tasks
  - Title, description, priority (Low / Medium / High)
  - Status: Todo / In Progress / Done
  - Due dates with automatic overdue detection
  - Assign tasks to project members (server validates membership)
  - DRAG-AND-DROP Kanban board between columns
    + dropdown fallback on each card
  - Optimistic UI on status updates; reload reverts if rejected
  - Created / completed timestamps

Dashboard
  - Stat cards: total projects, total tasks, in-progress,
    completed, overdue, my open tasks
  - Total Users stat card visible only to global Admins
  - "Tasks per User" breakdown (totals + per-status + overdue)
  - "My Tasks" panel + Overdue panel + Recent activity
  - Global Admin's dashboard aggregates across ALL projects

Role-based access (3 tiers, server-enforced)
  See the matrix in the next section.

----------------------------------------------------------------
  ROLES & PERMISSIONS
----------------------------------------------------------------
The app has TWO role layers:

  1. GLOBAL ROLE   on the User document: 'Admin' or 'Member'.
     Controls system-wide superuser access.

  2. PROJECT ROLE  on each project's members[]: 'Admin' or
     'Member'. Controls per-project capabilities.

A user's effective permissions are the union of their global
and project roles.

How to BECOME each role
-----------------------
  Global Admin  - Be the first user to sign up on a fresh DB,
                  OR wipe the DB (`npm run db:reset -- --yes`)
                  and sign up,
                  OR edit your `users` doc in Atlas, set
                  "role": "Admin", and re-login.
  Project Owner - Create a project (you become its Owner
                  automatically).
  Project Admin - Be invited as a project member with role
                  'Admin', or be promoted by the Owner / a
                  project Admin / a Global Admin.
  Project Member- Be invited with role 'Member' (default).

PERMISSION MATRIX
-----------------
                                 GA   Owner  PAdmin  Member
See ALL projects in system        Y    own    own    own
Open a project                    any  own    own    own
Edit project name/desc/status     Y    Y      Y       N
Delete project                    Y    Y      N       N
Add a member                      Y    Y      Y       N
Remove a member (not Owner)       Y    Y      Y       N
Change a member's role            Y    Y      Y       N
Create a task                     Y    Y      Y       N
Edit task (title/desc/priority/
  due/assignee)                   Y    Y      Y       N
Reassign a task                   Y    Y      Y       N
Change task status                Y    Y      Y      only
                                                   when assigned
Delete a task                     Y    Y      N       N
See total user count              Y    N      N       N

(GA = Global Admin, PAdmin = Project Admin)
The Project Owner cannot be removed by anyone (sacred).

MEMBER CAPABILITIES AT A GLANCE
-------------------------------
A Member CAN:
  - View projects they're part of
  - View "My Tasks" with status / priority filters
  - Drag (or use the dropdown to set) the status of tasks
    assigned to them
  - See the team roster (read-only)

A Member CANNOT:
  - Edit the project, manage members, or change roles
  - Create, edit, reassign, or delete tasks
  - Edit a task's details
  - See system-wide stats

----------------------------------------------------------------
  PROJECT STRUCTURE
----------------------------------------------------------------
Ethara/
  backend/                     Express + Mongoose API
    config/db.js               MongoDB connection
    models/                    User, Project, Task schemas
    middleware/                auth.js (JWT) + projectAccess.js
    controllers/               auth, project, task logic
    routes/                    /api/auth, /api/projects, /api/tasks
    scripts/resetDb.js         Wipes every collection (guarded)
    server.js                  Entrypoint; serves frontend in prod
    .env.example               Sample env vars
  frontend/                    React (Vite) SPA
    src/
      pages/                   Login, Signup, Dashboard, Projects,
                               ProjectDetail, Tasks
      components/              Navbar, ProtectedRoute, TaskCard
      context/                 AuthContext (login/signup/logout)
      api.js                   Axios client w/ JWT interceptor
      styles.css               Modern CSS theme
    vite.config.js             Dev proxy /api -> :5000
  railway.json                 Railway build/start config
  Procfile                     Process spec for Railway
  package.json                 Root scripts (monorepo)
  README.md                    Markdown version
  README.txt                   This file

----------------------------------------------------------------
  REST API
----------------------------------------------------------------
Auth (/api/auth)
  POST   /signup                 { name, email, password }
  POST   /login                  { email, password }
  GET    /me                     (auth) current user
  GET    /users                  (auth) list users

Projects (/api/projects)         all require auth
  POST   /                       any user
  GET    /                       own projects, or all if Global Admin
  GET    /:id                    members + Global Admin
  PUT    /:id                    project Admin / Owner / Global Admin
  DELETE /:id                    Owner or Global Admin only
  POST   /:id/members            project Admin / Owner / Global Admin
  PUT    /:id/members/:userId    project Admin / Owner / Global Admin
  DELETE /:id/members/:userId    project Admin / Owner / Global Admin
                                 (cannot remove Owner)

Tasks (/api/tasks)               all require auth
  GET    /dashboard              any (response varies by role)
  POST   /                       project Admin / Owner / Global Admin
  GET    /                       members of queried project, or all
                                 if Global Admin
  GET    /:id                    members + Global Admin
  PUT    /:id                    details: project Admin / Owner /
                                 Global Admin
                                 status: also assignee
  DELETE /:id                    Owner or Global Admin only

  Filters on GET /api/tasks:
    ?project=<id>  ?status=...  ?priority=...
    ?assignedTo=<id>  ?mine=true

Health
  GET    /api/health             public health check

----------------------------------------------------------------
  LOCAL DEVELOPMENT
----------------------------------------------------------------
1. Install

   git clone <your-repo-url> taskflow
   cd taskflow
   npm run install-all

2. Backend env

   cd backend
   cp .env.example .env
   # Fill in MONGO_URI and JWT_SECRET

3. Backend  (terminal 1)
   npm run dev          # http://localhost:5000

4. Frontend (terminal 2)
   cd ../frontend
   npm run dev          # http://localhost:5173

5. Sign up - first user becomes Global Admin.

USEFUL ROOT-LEVEL SCRIPTS
-------------------------
  npm run install-all          Install backend + frontend deps
  npm run dev:backend          Run backend with nodemon
  npm run dev:frontend         Run Vite dev server
  npm run build                Build the React frontend
  npm start                    Start the production backend
  npm run db:reset -- --yes    Wipe every collection (guarded)

The reset script reads MONGO_URI from backend/.env, connects,
and runs deleteMany({}) on every collection. It does NOT drop
the database; collections remain (empty), so you can sign up
immediately afterwards and reclaim Global Admin.

----------------------------------------------------------------
  ENVIRONMENT VARIABLES (backend/.env)
----------------------------------------------------------------
PORT          Local port. DO NOT set on Railway.
MONGO_URI     MongoDB connection string (Atlas or local)
JWT_SECRET    Long random string used to sign JWTs
JWT_EXPIRE    Token lifetime (default 7d)
NODE_ENV      "development" or "production". In production,
              the backend also serves the built frontend.

----------------------------------------------------------------
  DEPLOYMENT — RAILWAY (SINGLE SERVICE)
----------------------------------------------------------------
The Express server serves both the REST API and the React
build, so frontend and backend share ONE origin. That means
NO CORS config is needed and the frontend doesn't need its
own .env or VITE_API_URL (it uses a relative "/api" path).

STEPS
-----
1. Push to GitHub.

2. Railway -> New Project -> Deploy from GitHub repo,
   pick this repo.

3. Variables -> Raw Editor -> paste:

       MONGO_URI=mongodb+srv://USER:PASS@cluster.mongodb.net/taskmanager?retryWrites=true&w=majority
       JWT_SECRET=<long random string>
       JWT_EXPIRE=7d
       NODE_ENV=production

   DO NOT set PORT (Railway injects it).

4. MongoDB Atlas -> Network Access -> + Add IP Address ->
   Allow from anywhere (0.0.0.0/0).

5. Railway reads railway.json and runs:
       Build:  npm install --prefix backend --include=dev
               npm install --prefix frontend --include=dev
               npm run build --prefix frontend
       Start:  npm start --prefix backend

   --include=dev is needed because Railway sets
   NODE_ENV=production during builds.

6. Settings -> Networking -> Generate Domain. Open URL.

7. Sign up - you become the Global Admin (fresh DB).

VERIFY
------
  https://<domain>/api/health  -> {"status":"ok",...}
  https://<domain>/             -> TaskFlow signup page

NOTES
-----
- Editing Railway variables auto-restarts the service.
  No code push or manual redeploy needed for env-only changes.
- Code pushes to main auto-redeploy.
- All data is stored in MongoDB Atlas (free M0 tier is enough).

----------------------------------------------------------------
  QUICK TOUR
----------------------------------------------------------------
1. Sign up - first user becomes Global Admin.
2. Create a Project - you're the Owner + Project Admin.
3. Members tab -> invite a teammate by email; pick Admin
   or Member.
4. Board tab -> "+ New Task". Set title, description,
   priority, due date, assignee.
5. Drag cards between Todo / In Progress / Done, or use the
   dropdown on each card.
6. Dashboard -> stats + per-user breakdown + overdue list.
   My Tasks -> all tasks assigned to you across projects.
7. As Global Admin, Projects shows EVERY project in the
   system.

----------------------------------------------------------------
  SUBMISSION CHECKLIST
----------------------------------------------------------------
[X] Authentication (signup / login / JWT)
[X] Project & team management (invitations, role changes)
[X] Task creation, assignment, status tracking
[X] Drag-and-drop Kanban board (Todo/In Progress/Done)
[X] Dashboard: total tasks / by status / per user / overdue /
    total users
[X] REST APIs + MongoDB
[X] Validation (server + client) and error handling
[X] Relationships (User -> Project -> Task)
[X] Three-tier role-based access (Global Admin /
    Project Admin / Member), enforced server-side
[X] Frontend (React, responsive UI)
[X] Backend (Node + Express)
[X] Separate /backend and /frontend folders
[X] Railway single-service deploy config
[X] No CORS / no frontend env vars required
[ ] Live URL              <-- fill in after deploy
[ ] GitHub repo URL       <-- fill in after push
[ ] 2-5 min demo video    <-- record full walkthrough

----------------------------------------------------------------
  LICENSE
----------------------------------------------------------------
MIT - feel free to use this as a starter for your own work.
