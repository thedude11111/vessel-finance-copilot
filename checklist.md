# Vessel Finance Copilot Checklist

## Phase 0: Monorepo and Project Setup
- [x] Create root `package.json` for pnpm workspaces.
- [x] Create `pnpm-workspace.yaml` file.
- [x] Create `.gitignore` file.
- [x] Create `packages/client`, `packages/server`, and `packages/shared-types` directories.

## Phase 1: Backend API (Server)
- [x] Initialize Node.js project in `packages/server`.
- [x] Install server dependencies: `express`, `cors`, `dotenv`.
- [x] Install server dev dependencies: `typescript`, `ts-node`, `nodemon`, `@types/express`, `@types/cors`, `@types/node`.
- [x] Configure `tsconfig.json` in `packages/server`.
- [x] Create a basic Express server in `packages/server/src/index.ts`.
- [x] Add Prisma ORM and initialize it.
- [x] Define the database schema in `packages/server/prisma/schema.prisma`.
- [x] Install Google AI SDK (`@google/generative-ai`).
- [x] Create Gemini API service in `packages/server/src/services/geminiService.ts`.
- [x] Implement authentication endpoints.
- [x] Implement analysis management endpoints.
- [ ] Implement AI and calculation endpoints:
  - [x] Implement logic to save extracted parameters as `VesselParameter` records.
  - [x] Implement complex financial calculations and save results to `AnalysisResult` table.
- [x] Implement a centralized error handling middleware.
- [x] Replace `any` type usages with specific interfaces.
- [x] Ensure secure management of `JWT_SECRET` and restrict CORS.
- [x] Implement a robust logging solution.
- [x] Develop comprehensive unit and integration tests.

## Phase 2: Frontend (Client)
- [x] Initialize React/Vite project in `packages/client`.
- [x] Install and configure Tailwind CSS.
- [x] Initialize Shadcn/UI.
- [x] Install additional client dependencies: `axios`, `zustand`, `recharts`.
- [x] Create global state stores with Zustand (`authStore.ts`, `analysisStore.ts`).
- [x] Create centralized Axios instance for API communication.
- [x] Build UI components.
- [x] Implement authentication flow.
- [x] Implement analysis chat interface.
- [x] Implement results display (tables and graphs).
- [x] Connect `AnalysisChat` to backend API for parameter extraction and result analysis.
- [x] Fetch and display analysis results using `ResultsTable` and `ResultsGraphs`.
- [x] Implement proper user information retrieval after Google OAuth.
- [x] Define specific interfaces for `parameters`, `results`, and `chartData`.
- [x] Implement robust error handling for API calls.
- [x] Ensure proper utilization of loading states.
- [x] Consider adding `dialog` components for user interactions.

## Phase 3: Deployment
- [ ] Prepare for Railway deployment.
- [x] Add `serve` dependency to client for production server.