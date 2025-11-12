🧩 Software Change Management System (SCMS)

A MERN stack-based Change Management System built for tracking, reviewing, and approving change requests in software projects.
This project supports multiple user roles (Developer, QA Engineer, Change Manager, etc.) and integrates with MongoDB Atlas (Cloud) for collaborative data sharing.

🧠 Tech Stack
Layer	Technology
Frontend	React + TailwindCSS
Backend	Node.js + Express
Database	MongoDB Atlas Cloud
Authentication	JWT (JSON Web Token)
Hosting (optional)	Render / Vercel / Railway
⚙️ Folder Structure
PESU_RR_AIML_C_P05_Change_management_software_Omega/
│
├── scms-api/          # Backend (Node + Express)
│   ├── server.js
│   ├── .env
│   ├── package.json
│   └── ...
│
├── scms-frontend/     # Frontend (React)
│   ├── src/
│   ├── package.json
│   └── ...
│
└── README.md

🧩 Prerequisites

Node.js (v18+)

npm (v9+)

MongoDB Atlas account → https://www.mongodb.com/cloud/atlas

Git (for version control)

🚀 Backend Setup (scms-api)
1️⃣ Go to the backend folder
cd scms-api

2️⃣ Install dependencies
npm install

3️⃣ Create .env file

Create a file named .env inside scms-api/ and add:

PORT=5000
MONGO_URI=mongodb+srv://riddhi_scms_db_user:<your_password>@cluster0.<your_cluster_id>.mongodb.net/scms_db?retryWrites=true&w=majority
JWT_SECRET=a_very_secret_key_for_scms_jwt_12345


⚠️ Replace <your_password> and <your_cluster_id> with your actual MongoDB Atlas credentials.

4️⃣ Run the backend server

For development (auto-restart on save):

npm run dev


Or for production:

npm start


✅ Expected Output:

[dotenv] injecting env from .env
Server running on http://localhost:5000
✅ MongoDB Atlas Connected

🌐 Frontend Setup (scms-frontend)
1️⃣ Go to frontend folder
cd scms-frontend

2️⃣ Install dependencies
npm install

3️⃣ Start the React app
npm start


✅ Expected:

React app runs at: http://localhost:3003

Communicates with backend at: http://localhost:5000

☁️ Connecting MongoDB Atlas

If your team wants to share the same database:

In MongoDB Atlas → Database Access, create a user:

Username: riddhi_scms_db_user
Password: <your_password>


In Network Access, add:

0.0.0.0/0


Copy the connection URI from:
→ Cluster → Connect → Drivers

Paste that URI in everyone’s .env file as MONGO_URI.

Now all teammates connect to the same cloud DB!

👥 Roles Supported
Role	Permissions
Developer	Create new CRs, view assigned ones
QA Engineer	Review & test CRs, approve/reject
Technical Lead	Final approval, view all CRs
Change Manager	Manage approvals, oversee all CRs
Release Manager	Schedule and close approved CRs
DevOps Engineer	Monitor deployment-related CRs
Auditor	Read-only access to all records
System Admin	Manage user roles and system config
🧠 Common Commands
Task	Command
Run backend (dev)	npm run dev
Run backend (prod)	npm start
Run frontend	npm start
Install deps	npm install
Import data to Atlas	mongorestore --uri "<MONGO_URI>" scms_backup/scms_db
Export data from local	mongodump --db=scms_db --out=scms_backup
🧰 Environment Variables
Variable	Description
PORT	Backend server port
MONGO_URI	MongoDB Atlas connection string
JWT_SECRET	Secret key for JWT authentication
🧾 Example API Endpoints
Endpoint	Method	Description
/api/auth/register	POST	Register new user
/api/auth/login	POST	Login and get JWT
/api/cr/	GET	Fetch all change requests
/api/cr/:id	GET	Fetch CR by ID
/api/cr/	POST	Create a new CR
/api/cr/:id	PUT	Update a CR
/api/cr/:id	DELETE	Delete a CR
🧩 Deployment (Optional)

If you want to deploy:

Frontend: Vercel / Netlify

Backend: Render / Railway

Database: MongoDB Atlas (already cloud-based)

👨‍💻 Contributors
Name	Role
Riddhi Samitha	QA Engineer
[Teammate 1]	Developer
[Teammate 2]	Change Manager
[Teammate 3]	Auditor
Team Omega	Full Project Development
🏁 Summary

✅ Local & Cloud setup ready
✅ Shared MongoDB Atlas DB
✅ Clean .env
✅ Working scripts (start, dev)
✅ Full documentation for teammates or viva/demo