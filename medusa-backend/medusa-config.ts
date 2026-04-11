import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET!,
      cookieSecret: process.env.COOKIE_SECRET!,
    }
  },
  modules: [
    {
      resolve: "./src/modules/feeling",
    },
    {
      resolve: "./src/modules/subfeeling",
    },
    {
      resolve: "./src/modules/artist",
    },
    {
      resolve: "./src/modules/occasion",
    },
    {
      resolve: "./src/modules/merch-event",
    },
  ],
  admin: {
    backendUrl: process.env.MEDUSA_BACKEND_URL,
  },
})
