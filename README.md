A real-time, AI-powered vehicle health monitoring system that predicts failures before they occur. Connects vehicle telemetry (via STM32/CAN bus) to a cloud dashboard, providing actionable insights for Drivers, Mechanics, and Fleet Managers.
     
Feature	Description

    Role-Based Dashboards -> Tailored views for Driver, Mechanic, and Fleet Manager
    Real-Time Sync -> Live data updates every 3 seconds via Firebase RTDB
    Predictive Health Al -> Custom RL model forecasts component failures (1-45 days)
    Context-Aware Thresholds -> Adaptive limits for City vs. Highway driving modes
    Explainable Alerts -> Natural-language wamings with actionable guidance
    PDF Service Analysis -> LLM-powered extraction of insights from service reports
    Mechanic Locator -> Interactive OpenStreetMap with specialized shop filtering
    Edge-First Safety -> STM32 local evaluation for offline-critical alerts
    Glassmorphism Ul -> Modem dark/light theme with smooth Framer Motion animations

Implementation Approach:
    Edge-First Safety: Critical metrics (Engine Temp, Oil Pressure) evaluated on STM32.
    Cloud AI Processing: Reinforcement Learning model analyzes historical trends to predict Remaining Useful Life (RUL) of components.
    Role-Based Access: Strict separation of concerns; Drivers see simplified "Go/No-Go", Mechanics see diagnostic codes, Fleet Managers see analytics.
    
Core Framework:

    Nextjs -> App Router, Server Components, API Routes
    React -> Ul library with hooks and concurrent features
    TypeScript -> End-to-end type safety and interface definitions

Styling & UI:

    Tailwind CSS -> Utility-first styling with custom glassmorphism effects
    Framer Motion -> Production-ready animations and page transitions
    Lucide React -> Consistent, accessible iconography

Data Visualization & Maps :

    Recharts -> Interactive health trends, radar charts, and analytics
    Leaflet + OpenStreetMap -> Interactive mechanic shop locator with real-time positioning

Backend & Database:

    Nextjs API Routes -> RESTful  endpoints for vehicle, alert, and leaming operations
    Prisma ORM -> Type-safe database queries and schema management
    SQLite -> Local development database with easy migration path
    Firebase Realtime Database -> Production cloud sync for STM32 telemetry

AI & Machine Learning:

    RL Engine -> Reinforcement leaming for health prediction and pattem recognition
    LLM SDK Integration -> Natural language analysis of uploaded PDF service reports

  