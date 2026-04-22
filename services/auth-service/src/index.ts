import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import { typeDefs } from './graphql/typeDefs'
import { resolvers } from './graphql/resolvers'

dotenv.config()

const startServer = async () => {
  // Connect to MongoDB
  await mongoose.connect(process.env.MONGODB_URI!)
  console.log('✅ MongoDB connected')

  const server = new ApolloServer({ typeDefs, resolvers })

  const { url } = await startStandaloneServer(server, {
    listen: { port: Number(process.env.PORT) },
    context: async ({ req }) => {
      // Extract JWT from Authorization header
      const token = req.headers.authorization?.replace('Bearer ', '')
      if (!token) return {}

      try {
        const decoded: any = jwt.verify(token, process.env.JWT_ACCESS_SECRET!)
        return { userId: decoded.userId, role: decoded.role }
      } catch {
        return {}
      }
    }
  })

  console.log(`🚀 Auth Service ready at ${url}`)
}

startServer().catch(console.error)