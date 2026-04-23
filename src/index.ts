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