# kanban-assignment
Assignment
🧩 Assignment: Personal Kanban Board with Persistent State


🎯 Objective
Build a single-user Kanban-style task board in React that persists tasks between reloads. 



🖥️ Feature Requirements
Board Structure

A 3-column layout:

To Do

In Progress

Done

Core Functionality

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

State management via:

React Context + useReducer, OR

Zustand

Local persistence (via localStorage)

Styled with either:

TailwindCSS (preferred),

CSS modules,

OR any other lightweight CSS strategy

Typescript is encouraged but not mandatory

📦 Deliverables
A public GitHub repo

A README.md with:

Setup instructions

Brief notes on your architecture

Time spent

Any shortcuts taken

