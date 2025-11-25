# Nexa Auth Frontend

This is the frontend for the Nexa Auth application, built with React, Vite, and Tailwind CSS.

## Features
- **Modern UI**: Futuristic glassmorphism design using Tailwind CSS.
- **Authentication**: Login and Register pages with JWT auth.
- **Floating Bubble**: A persistent, draggable AI assistant bubble.
- **Groq Integration**: Demo page for interacting with Groq API.

## Setup & Run

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run Development Server**:
    ```bash
    npm run dev
    ```

3.  **Build for Production**:
    ```bash
    npm run build
    ```

## Project Structure
- `src/components/Bubble`: Contains the Floating Bubble and its panel.
- `src/ui`: Reusable UI components (Button, IconButton, Modal).
- `src/pages`: Application pages (Login, Register, Home, GroqDemo).
- `src/hooks`: Custom hooks (useAuth, useLocalStorage).
- `src/api.js`: Axios instance with auth interceptor.

## Tailwind Configuration
The project uses a custom Tailwind configuration (`tailwind.config.cjs`) with neon colors and glassmorphism utilities.
