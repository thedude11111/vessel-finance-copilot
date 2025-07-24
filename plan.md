# Vessel Finance Copilot: Development Plan

## Section 1: Core Philosophy & High-Level Architecture

This project will be developed using a **monorepo architecture**, managed by `pnpm` workspaces. The monorepo will contain logically separate packages for the `client` (frontend), `server` (backend), and potentially `shared-types`.

This approach offers several key advantages:

  * **Centralized Codebase:** Simplifies dependency management and ensures consistency across the entire application.
  * **Streamlined Development:** Enables atomic commits and pull requests that span multiple parts of the application (e.g., an API change and the corresponding frontend update).
  * **Clear Separation of Concerns:** Despite being in one repository, the services are decoupled, allowing them to be developed, tested, and deployed independently.

The designated deployment platform is **Railway**. Railway excels at deploying monorepos without requiring complex configuration or `Dockerfile`s. It automatically detects services within the repository, manages database provisioning, and injects environment variables, making the deployment process seamless and efficient.

-----

## Section 2: Technology Stack

The technology stack is chosen for its synergy, performance, and strong typing, which is critical for a financial application requiring high accuracy.

  * **Frontend:**

      * **Framework:** **React** with **Vite** for a fast and modern development experience.
      * **Language:** **TypeScript** for robust type safety.
      * **Styling:** **Tailwind CSS** for utility-first styling.
      * **UI Components:** **Shadcn/UI** for its accessible, unstyled, and composable components.
      * **State Management:** **Zustand** for simple, lightweight global state management.
      * **API Client:** **Axios** for making HTTP requests to the backend.

  * **Backend:**

      * **Runtime:** **Node.js** with the **Express** framework.
      * **Language:** **TypeScript** for type safety and scalability.
      * **Authentication:** **JSON Web Tokens (JWT)** for securing API endpoints, integrated with Google OAuth 2.0.

  * **Database:**

      * **Engine:** **PostgreSQL**, a powerful and reliable relational database.
      * **ORM:** **Prisma** for intuitive, type-safe database access and schema management.

  * **AI Integration:**

      * **Model:** **Google Gemini API (gemini-1.5-pro-latest)** for both parameter extraction and results analysis.

  * **Development & Tooling:**

      * **Package Manager:** **pnpm** with **pnpm workspaces** to manage the monorepo.

-----

## Section 3: Project Structure (Monorepo)

The project will be organized in a monorepo structure. All services will reside within the `packages` directory.

```plaintext
/vessel-finance-copilot (monorepo root)
├── .gitignore
├── package.json         # Root package.json with pnpm workspace config
├── pnpm-workspace.yaml  # Defines the workspaces
├── packages/
│   ├── client/          # React Frontend App
│   │   ├── public/
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── server/          # Node.js Backend API
│   │   ├── src/
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── shared-types/    # (Optional) For sharing types between client & server
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
└── README.md
```

-----

## Section 4: Detailed Development Plan

### Phase 1: Backend API (Server)

**1. Setup Node.js/Express Project with TypeScript:**

  * Initialize a new Node.js project in `packages/server`.
  * Install dependencies: `express`, `typescript`, `ts-node`, `nodemon`, `@types/express`, `cors`, `dotenv`.
  * Configure `tsconfig.json` for a modern Node.js project, setting `outDir` to `dist`.
  * Create a basic Express server in `src/index.ts` that listens on a specified port.

**2. Integrate Prisma and PostgreSQL:**

  * Install Prisma CLI as a dev dependency: `pnpm add -D prisma`.
  * Initialize Prisma: `npx prisma init --datasource-provider postgresql`. This creates the `prisma` directory and the `.env` file.
  * Define the database schema in `prisma/schema.prisma`. The schema must support user authentication, flexible analysis parameters, and storing complex results.

**3. `schema.prisma` Definition:**

```prisma
// This is your Prisma schema file.
// Learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id              String           @id @default(cuid())
  email           String           @unique
  name            String?
  googleId        String           @unique
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  vesselAnalyses  VesselAnalysis[]
}

model VesselAnalysis {
  id                String              @id @default(cuid())
  name              String
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  user              User                @relation(fields: [userId], references: [id])
  userId            String
  parameters        VesselParameter[]
  results           AnalysisResult?
}

// Flexible key-value store for user-defined parameters
model VesselParameter {
  id                String           @id @default(cuid())
  key               String           // e.g., "vesselPrice", "dailyCharterRate"
  value             String           // Stored as string, parsed in backend
  type              String           // e.g., "currency", "percentage", "years"
  analysis          VesselAnalysis   @relation(fields: [analysisId], references: [id], onDelete: Cascade)
  analysisId        String
}

// Stores the complex, calculated financial results as JSON
model AnalysisResult {
  id                      String           @id @default(cuid())
  calculatedAt            DateTime         @default(now())
  cashFlowProjections     Json             // JSON object or array for cash flow table
  profitabilityMetrics    Json             // JSON object for metrics like NPV, IRR, Payback Period
  chartData               Json             // JSON formatted for frontend charting libraries
  analysis                VesselAnalysis   @relation(fields: [analysisId], references: [id], onDelete: Cascade)
  analysisId              String           @unique
}
```

**4. Build RESTful API Endpoints:**

  * **Authentication:**
      * `POST /api/auth/google`: Accepts a Google ID token. Verifies the token, finds or creates a `User`, and returns a JWT. Use `passport` with `passport-google-oauth20` strategy.
  * **Analysis Management:**
      * `POST /api/analysis`: Creates a new `VesselAnalysis` linked to the authenticated user.
      * `GET /api/analysis`: Lists all analyses for the authenticated user.
      * `GET /api/analysis/:id`: Retrieves a single analysis, including its parameters and results.
      * `DELETE /api/analysis/:id`: Deletes an analysis.
  * **AI & Calculation:**
      * `POST /api/analysis/:id/chat-parameters`:
        1.  Receives user chat input (`{ message: "The vessel price is $50 million." }`).
        2.  Calls the Gemini service (see step 5) with a prompt to extract financial parameters.
        3.  Gemini should return structured JSON (e.g., `{ "key": "vesselPrice", "value": "50000000", "type": "currency" }`).
        4.  **Implement logic to save the extracted data as `VesselParameter` records in the database.**
      * `POST /api/analysis/:id/run-calculation`:
        1.  Fetches all `VesselParameter` records for the analysis.
        2.  **Implement the complex financial calculations (e.g., cash flow, NPV, IRR) in a separate, well-tested service module.**
        3.  **Save the calculated output in the `AnalysisResult` table.**
      * `POST /api/analysis/:id/chat-results`:
        1.  Receives a user question about the results (`{ question: "What is the internal rate of return?" }`).
        2.  Fetches the `AnalysisResult` data.
        3.  Calls the Gemini service with a prompt instructing it to act as a financial analyst, providing both the results data and the user's question.
        4.  Returns Gemini's natural language answer to the frontend.

  * **General Backend Improvements:**
      *   **Error Handling:** Implement a centralized error handling middleware for consistent error responses.
      *   **Type Definitions:** Replace `any` type usages with more specific interfaces for improved type safety.
      *   **Security:** Ensure secure management of `JWT_SECRET` and restrict CORS to the `CLIENT_URL` in production.
      *   **Logging:** Implement a robust logging solution for better monitoring and debugging.
      *   **Testing:** Develop comprehensive unit and integration tests for all API endpoints and business logic, especially financial calculations.

**5. Gemini API Service (`geminiService.ts`):**

  * Install the Google AI SDK: `pnpm add @google/generative-ai`.
  * Create a reusable wrapper for the Gemini API.

<!-- end list -->

````typescript
// src/services/geminiService.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

/**
 * Extracts structured financial parameters from a user's chat message.
 * @param message - The user's natural language input.
 * @returns A promise that resolves to a structured JSON object of parameters.
 */
export async function extractParametersFromMessage(message: string): Promise<any> {
    const prompt = `
        You are an expert financial analyst assistant for the shipping industry.
        Your task is to extract financial parameters from the user's text and return them as a clean JSON object.
        The user is defining variables for a vessel purchase financial model.
        Identify the parameter key (in camelCase), its value (as a raw number), and its type (e.g., "currency", "percentage", "years", "tonnage", "text").
        User input: "${message}"
        JSON output:
    `;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    try {
        // Clean up the text to ensure it's valid JSON before parsing
        const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Failed to parse Gemini response as JSON:", error);
        throw new Error("AI response was not valid JSON.");
    }
}

/**
 * Answers questions about a financial analysis based on provided data.
 * @param question - The user's question.
 * @param analysisData - The calculated financial data (results).
 * @returns A promise that resolves to a natural language answer.
 */
export async function analyzeResults(question: string, analysisData: any): Promise<string> {
    const prompt = `
        You are a helpful financial analyst. You will be given a set of calculated financial results for a shipping vessel investment and a user's question about those results.
        Your task is to answer the user's question based *only* on the provided data. Do not make up information.
        Be clear and concise.

        Provided Data: ${JSON.stringify(analysisData, null, 2)}

        User Question: "${question}"

        Your Answer:
    `;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
}
````

### Phase 2: Frontend (Client)

**1. Setup React/Vite Project:**

  * In `packages/client`, initialize a new React project with Vite and the TypeScript template: `pnpm create vite . --template react-ts`.
  * Install dependencies: `tailwindcss`, `postcss`, `autoprefixer`.
  * Initialize Tailwind CSS: `npx tailwindcss init -p`. Configure `tailwind.config.js` and `index.css`.

**2. Implement UI with Shadcn/UI:**

  * Initialize Shadcn/UI: `npx shadcn-ui@latest init`.
  * Add components as needed: `button`, `card`, `input`, `table`, `dialog`, `chart` (using the charting primitive).
  * Build the UI structure with reusable components for:
      * `GoogleLoginButton.tsx`
      * `AnalysisChat.tsx` (a generic chat interface configurable for both parameter input and results Q\&A)
      * `ResultsTable.tsx` (using Shadcn's `Table`)
      * `ResultsGraphs.tsx` (using a library like `recharts` integrated with Shadcn `Chart`)
      * Layout components (`Header`, `Sidebar`, etc.).

**3. Global State with Zustand:**

  * Install Zustand: `pnpm add zustand`.
  * Create stores in `src/stores/`:
      * **`authStore.ts`:** To manage user info and JWT token.
      * **`analysisStore.ts`:** To manage the active analysis state, including parameters, results, loading states, and chat history.

<!-- end list -->

```typescript
// src/stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  user: { name: string; email: string; } | null;
  setToken: (token: string) => void;
  setUser: (user: any) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'auth-storage', // key in localStorage
    }
  )
);
```

**4. API Connection with Axios:**

  * Install Axios: `pnpm add axios`.
  * Create a centralized Axios instance that automatically includes the JWT token in headers for authenticated requests.

<!-- end list -->

```typescript
// src/api/axios.ts
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
});

apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
```

  * **General Frontend Improvements:**
      *   **API Integration:** Connect `AnalysisChat` to the backend API for parameter extraction and result analysis. Implement API calls to send messages and update chat history.
      *   **Data Display:** Fetch and display analysis results using `ResultsTable` and `ResultsGraphs` components.
      *   **User Information:** Implement proper user information retrieval after Google OAuth, either by decoding the JWT token or making a separate API call.
      *   **Type Definitions:** Define specific interfaces for `parameters`, `results`, and `chartData` in `analysisStore.ts` and related components to replace `any` types.
      *   **Error Handling:** Implement robust error handling for API calls, including displaying user-friendly error messages.
      *   **Loading States:** Ensure proper utilization of loading states across all components that make API calls to provide visual feedback to the user.
      *   **UI Completeness:** Consider adding `dialog` components for user interactions, such as creating new analyses.

-----

## Section 5: Deployment on Railway (Docker-based)

Deploying this monorepo to Railway will now leverage Dockerfiles for explicit control over the build and deployment process for each service.

**1. Initial Setup:**

  * Push the monorepo to a GitHub repository.
  * Create a new project on Railway and link it to the GitHub repository.

**2. Provision the Database Service:**

  * Click "Add a service" and choose "Database" -> "PostgreSQL". Railway will automatically provision the database and provide a `DATABASE_URL` environment variable.

**3. Configure the Backend Service (using Dockerfile):**

  * Add a new service pointing to the GitHub repo.
  * Select **"Docker Image"** or **"Deploy from Dockerfile"**.
  * **Dockerfile Path:** `./packages/server/Dockerfile`
  * **Environment Variables:**
      * `DATABASE_URL`: Railway will inject this from the PostgreSQL service. Reference it via `${{PostgreSQL.DATABASE_URL}}`.
      * `GEMINI_API_KEY`: Your private key for the Google Gemini API.
      * `JWT_SECRET`: A long, random string for signing JWTs.
      * `CLIENT_URL`: The public URL of your deployed frontend (e.g., `https://vessel-finance-copilot-client.up.railway.app`). This is needed for CORS.
      * `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID.
      * `GOOGLE_CLIENT_SECRET`: Your Google OAuth Client Secret.
      * `PORT`: Railway injects this automatically.

**4. Configure the Frontend Service (using Dockerfile):**

  * Add another new service pointing to the same GitHub repo.
  * Select **"Docker Image"** or **"Deploy from Dockerfile"**.
  * **Dockerfile Path:** `./packages/client/Dockerfile`
  * **Environment Variables:**
      * `VITE_API_BASE_URL`: The public URL of your deployed backend service (e.g., `https://vessel-finance-copilot-server.up.railway.app/api`).
      * `VITE_GOOGLE_CLIENT_ID`: Your Google OAuth Client ID (this needs to be exposed to the client).
      * `PORT`: Railway injects this automatically.

-----

## Section 6: Best Practices for AI-Followable Code

To ensure the downstream AI coding agent can execute this plan effectively, the following coding practices are mandatory.

  * **Explicit Naming:** Use clear and descriptive names for variables, functions, components, and files (e.g., `calculateNetPresentValue` instead of `calcNPV`).
  * **Single Responsibility Principle (SRP):** Each function, module, and component should do one thing and do it well. For example, separate API logic, business logic (financial calculations), and database interactions into different files/services.
  * **Consistent Formatting:** Use **Prettier** to automatically format all TypeScript, TSX, and JSON files. A pre-commit hook should be set up to enforce this.
  * **Detailed JSDoc Comments:** Every function, especially those containing business logic (like financial calculations or API service calls), must have JSDoc comments explaining its purpose, parameters (`@param`), and return value (`@returns`).
  * **Strict TypeScript:** Enable `strict` mode in all `tsconfig.json` files. Avoid using the `any` type. Define explicit types and interfaces for all data structures, especially API payloads and database models. The optional `shared-types` package can be used to share these types between the client and server.