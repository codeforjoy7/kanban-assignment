# kanban-assignment

🧩 Assignment: Personal Kanban Board with Persistent State

<img width="1467" height="915" alt="Screenshot 2025-09-15 at 6 56 04 pm" src="https://github.com/user-attachments/assets/09daf413-608f-4c0b-994f-0e658e61540c" />


🎯 Objective:

Build a single-user Kanban-style task board in React that persists tasks between reloads. 

🖥️ Feature Requirements:

Board Structure

A 3-column layout:

To Do
In Progress
Done

Core Functionality:
Add a new task (title + optional description)
Drag and drop tasks within and across columns
Edit a task's title inline
Delete a task
All changes should persist on refresh using localStorage (or IndexedDB, or a simple JSON-based API if you're feeling fancy)

✅ Stretch Goals (Optional, if time allows)
Filter tasks by keyword
Task history log (last 5 actions)
Auto-focus on new task input
Mobile responsive layout

⚙️ Technical Requirements
React (with hooks)
Component-level architecture
State management via: React Context + useReducer, OR Zustand
Local persistence (via localStorage)

Styled with either: TailwindCSS (preferred), CSS modules or any other lightweight CSS strategy

Typescript is encouraged but not mandatory

# 📦 Deliverables
# Setup instructions

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## `npm install` inside `kanban-frontend` and `kanban-backend` directory

To start the server: 

In the `kanban-backend` directory, you can run:

### `npm run dev`

Which should start the server to run on port 5000


# 📦 Inside the `kanban-frontend` directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `npm test`

Launches the test runner in the interactive watch mode.

### `npm run build`

Builds the app for production to the `build` folder.

# 📦 Brief notes on your architecture
- Full stack architecture with separate Frontend and Backend writte in React and Express(Node.js)
- REST API from the Express server with data persistence is through JSON file-based storage inside tasks.json, which could potentially scale with GraphQL query and schema attached to a real DB
- Zustand store (as mentioned) hadnles client state and optimistic updates for Drag & Drop, calls API for persistence, ato-refreshes after mutations
- Drag & Drop library to perform the kanban board operation
- TailwindCSS styling for consistent design system
- Modular and testable front-end components with Typescript
- Testing library for unit tests

Time spent (approx 4-5 hours)
