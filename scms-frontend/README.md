# 🧠 Software Change Management System (SCMS)

A frontend prototype of the **Software Change Management System (SCMS)** built with **React**, **Tailwind CSS**, and a **mock JSON Server backend**.

This project allows users to:
- Register and log in (with simulated JWT auth)
- View submitted Change Requests (CRs)
- Submit new CRs
- Filter CRs by status

---

## ⚙️ Tech Stack

| Layer | Technology |
|--------|-------------|
| Frontend | React + Tailwind CSS |
| Mock Backend | JSON Server |
| Routing | React Router DOM v6 |
| State Management | React Context API |
| API Client | Axios |

---

## 🧩 Folder Structure



Change-Management-Software/
├── scms-frontend/ # React app
│ ├── src/
│ │ ├── components/ # Shared components (ProtectedRoute, etc.)
│ │ ├── context/ # AuthContext for managing login state
│ │ ├── pages/ # App pages (Login, Register, Dashboard, SubmitCR)
│ │ ├── services/ # API layer (api.js)
│ │ ├── App.js # Main router configuration
│ │ └── index.js # React entry point
│ ├── package.json
│ └── ...
├── mock-data.json # Mock backend data
└── .env # Environment variables


---

## 🖥️ Setup Instructions

### ✅ Prerequisites

Before starting, make sure you have the following installed:

| Tool | Version | Check Command |
|------|----------|----------------|
| Node.js | v18+ | `node -v` |
| npm | v9+ | `npm -v` |

If not installed:
- **Windows:** [Download Node.js](https://nodejs.org/en/download/)
- **Mac:** `brew install node`

---

## 🚀 Step-by-Step Setup

### 1️⃣ Clone the repository

```bash
git clone <repo-url>
cd Change-Management-Software/scms-frontend

2️⃣ Install dependencies
npm install

3️⃣ Setup environment variables

Create a file named .env in the scms-frontend folder:

PORT=3003
REACT_APP_API_URL=http://localhost:5000

4️⃣ Setup mock backend

Create a file in the root folder (same level as scms-frontend) named mock-data.json:

{
  "auth": [
    {
      "id": 1,
      "email": "test@example.com",
      "password": "password123",
      "firstName": "John",
      "lastName": "Doe",
      "role": "Developer"
    },
    {
      "id": 2,
      "email": "manager@example.com",
      "password": "password123",
      "firstName": "Jane",
      "lastName": "Smith",
      "role": "Manager"
    }
  ],
  "changeRequests": [
    {
      "id": 1,
      "cr_number": "CR-001",
      "title": "Fix login issue for special characters",
      "category": "Normal",
      "status": "Pending",
      "created_at": "2025-11-01T09:00:00Z"
    },
    {
      "id": 2,
      "cr_number": "CR-002",
      "title": "Add user dashboard filters",
      "category": "Standard",
      "status": "Approved",
      "created_at": "2025-11-03T15:20:00Z"
    }
  ]
}

5️⃣ Start mock backend
🪟 On Windows (PowerShell)
npx json-server --watch ../mock-data.json --port 5000

🍎 On Mac/Linux
npx json-server --watch ../mock-data.json --port 5000


You should see output like:

JSON Server started on PORT :5000
Endpoints:
http://localhost:5000/auth
http://localhost:5000/changeRequests

6️⃣ Start React frontend
🪟 On Windows (PowerShell)
npm start

🍎 On Mac/Linux
PORT=3003 npm start


Then open your browser at:
👉 http://localhost:3003

🔐 Test Credentials

You can log in using:

Email	Password	Role
test@example.com
	password123	Developer
manager@example.com
	password123	Manager

Or use the Quick Login (Testing) button.

🧠 Common Issues
Issue	Fix
❌ ERR_CONNECTION_REFUSED	Make sure json-server is running on port 5000.
❌ react-scripts not recognized	Run npm install again in the scms-frontend directory.
❌ “Login failed”	Check if the email/password exists in mock-data.json.
⚠️ CORS Error	Ensure REACT_APP_API_URL=http://localhost:5000 is set correctly in .env.
🧪 Testing Flow

Run the mock backend.

Start the frontend.

Open http://localhost:3003/login
.

Login → Redirects to Dashboard.

Dashboard lists all mock CRs.

Try submitting a new CR (adds to mock JSON data).

📦 Optional: Reset mock data

If you want to restore the mock backend:

git checkout -- mock-data.json

👨‍💻 Authors

Team Omega
(132, 165, 175 — SCMS Project)
Software Engineering — PES University
Built for academic demonstration and prototype use.

🪶 License

This project is for educational purposes only.
All rights reserved © 2025 Team Omega.


---

Would you like me to make this README automatically include emojis, markdown badges (like “Built with React”, “Mock API”), and a prettier layout for GitHub display?  
That version looks **great** in project submissions and on GitHub pages.