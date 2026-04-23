# Contract Driven API Development

## Overview

@trpc/server: This is the heart of your "contract." 
tRPC allows you to build APIs where the frontend and backend share the exact same TypeScript types. 
If you change a function name on the server, the frontend will immediately show a red error—no documentation or manual syncing needed.

tsc-watch: A handy helper that watches your files. 
Every time you save a change, it automatically re-compiles your TypeScript and restarts your server so you don't have to do it manually.

@types/node & @types/express: These provide "definitions" for TypeScript. 
Since Node and Express were originally written in JavaScript, these packages tell TypeScript exactly what functions exist 
and what data they expect.

Zod is a TypeScript-first schema validation library used instead of vanilla JavaScript validation to bridge
the gap between static types and runtime data. 
While vanilla JavaScript requires manual if/else checks to ensure data integrity, 
Zod allows you to define a schema once and automatically infer TypeScript types, ensuring data validity at runtime. 

// Context is the information that is passed to the AI model to help it understand the user's request.
it is secure and user specific also its same as fastapi/docs

---

## Project Structure

```text
contract-driven-api-dev/
├── package.json
├── package-lock.json
├── tsconfig.json
├── README.txt
├── README.md
├── openapi-specification.json
└── src/
    ├── index.ts
    └── server/
        ├── context.ts
        ├── index.ts
        ├── trpc.ts
        └── routes/
            └── todo/
                ├── models.ts
                └── todo.routes.ts
```

---

## Configuration

### `package.json`

```json
{
  "name": "contract-driven-api-dev",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsc-watch --onSuccess \"node ./dist/index.js\""
  },
  "dependencies": {
    "@trpc/server": "^11.16.0",
    "express": "^5.2.1",
    "trpc-to-openapi": "^2.1.5",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/node": "^22.0.0",
    "tsc-watch": "^6.0.0",
    "typescript": "^5.0.0"
  }
}
```

---

## Source Code

### `src/index.ts`
```typescript
import express from 'express'
import * as trpcExpress from '@trpc/server/adapters/express';
import { generateOpenApiDocument, createOpenApiExpressMiddleware } from 'trpc-to-openapi';
import fs from 'fs/promises'
import { createContext } from './server/context.js';
import { appRouter } from './server/index.js';

const app = express()

app.use(express.json())

const openapiDocument = generateOpenApiDocument(appRouter, {
    baseUrl: 'http://localhost:8000/api',
    title: 'My TODO Server',
    version: '1.0.0',
})

fs.writeFile('./openapi-specification.json', JSON.stringify(openapiDocument))

app.get('/', (req, res) => {
    return res.json({ status: 'Server is up and running' })
})

app.get('/openapi.json', (req, res) => {
    return res.json(openapiDocument)
})

app.use('/api', createOpenApiExpressMiddleware({
    router: appRouter,
    createContext,
}))

// any request on /trpc will be mount to appRouter
// trpc-to-openapi doesn't support tRPC procedures on root router
// for example http://localhost:8000/trpc/todo.getAllTodos will work
// but http://localhost:8000/todo/getAllTodos will not work

// but if we use createOpenApiExpressMiddleware we can use /api as the base path
// http://localhost:8000/api/todo/getAllTodos will work

// but for now we are using tRPC express middleware
// this is why we are using /trpc as the base path

// for example http://localhost:8000/trpc/todo.getAllTodos will work

app.use(
    '/trpc',
    trpcExpress.createExpressMiddleware({
        router: appRouter,
        createContext,
    }),
);

app.listen(8000, () => console.log(`Express server is running on http://localhost:8000`))
```

### `src/server/context.ts`
```typescript
import * as trpcExpress from '@trpc/server/adapters/express';

export const createContext = ({
    req,
    res,
}: trpcExpress.CreateExpressContextOptions) => ({}); // no context

export type Context = Awaited<ReturnType<typeof createContext>>;
```

### `src/server/index.ts`
```typescript
import { router } from './trpc.js';
import { todoRouter } from './routes/todo/todo.routes.js';

// Root router
export const appRouter = router({
    todo: todoRouter
});

export type AppRouter = typeof appRouter;
```

### `src/server/trpc.ts`
```typescript
import { initTRPC } from '@trpc/server';
import type { OpenApiMeta } from 'trpc-to-openapi';
import type { Context } from './context.js';

const t = initTRPC.context<Context>().meta<OpenApiMeta>().create();

export const router = t.router;
export const publicProcedure = t.procedure; // authenticated and authorized (future)
```

### `src/server/routes/todo/models.ts`
```typescript
import { z } from 'zod'

export const todoModel = z.object({
    id: z.string().describe('UUID of the todo'),
    title: z.string().describe('Title of the todo'),
    description: z.string().optional().nullable().describe('description for the todo'),
    isCompleted: z.boolean().optional().default(false).describe('if the todo is completed or not')
})

export type Todo = z.infer<typeof todoModel>

export const getAllTodosOutputModel = z.object({
    todos: z.array(todoModel)
})
```

### `src/server/routes/todo/todo.routes.ts`
```typescript
import { router, publicProcedure } from '../../trpc.js';
import { z } from 'zod'
import { getAllTodosOutputModel, type Todo, todoModel } from './models.js'

const TODOS: Todo[] = [{ id: '1', isCompleted: false, title: 'Record Video', description: 'I need to record a video on prod grade apis' }]

export const todoRouter = router({
    createTodo: publicProcedure
        .meta({
            openapi: { method: 'POST', path: '/create-todo', tags: ['Todo'], description: 'Creates a new todo' }
        })
        .input(z.object({ title: z.string() }))
        .output(z.object({ todo: todoModel })).mutation(({ input }) => {
            TODOS.push({ id: '123', isCompleted: false, title: input.title })
            return {
                todo: { id: '123', isCompleted: false, title: input.title }
            }
        }),
    getAllTodos: publicProcedure
        .meta({
            openapi: {
                method: 'GET',
                path: '/todos',
                tags: ['Todo'],
                description: 'Returns all the todos',
            }
        })
        .input(z.object({}))
        .output(getAllTodosOutputModel)
        .query(() => {
            return {
                todos: TODOS
            }
        })
})
```
