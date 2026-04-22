import jwt from 'jsonwebtoken'
import User from '../models/User'

const generateTokens = (userId: string, role: string) => {
  const accessSecret = process.env.JWT_ACCESS_SECRET as string
  const refreshSecret = process.env.JWT_REFRESH_SECRET as string
  const accessExpiry = process.env.JWT_ACCESS_EXPIRY as string
  const refreshExpiry = process.env.JWT_REFRESH_EXPIRY as string

  const accessToken = jwt.sign(
    { userId, role },
    accessSecret,
    { expiresIn: accessExpiry as any }
  )

  const refreshToken = jwt.sign(
    { userId, role },
    refreshSecret,
    { expiresIn: refreshExpiry as any }
  )

  return { accessToken, refreshToken }
}

export const resolvers = {
  Query: {
    me: async (_: any, __: any, context: any) => {
      if (!context.userId) throw new Error('Not authenticated')
      return User.findById(context.userId)
    }
  },

  Mutation: {
    register: async (_: any, { name, email, password }: any) => {
      const existing = await User.findOne({ email })
      if (existing) throw new Error('Email already registered')

      const user = await User.create({ name, email, password })
      const tokens = generateTokens(user.id, user.role)

      return { ...tokens, user }
    },

    login: async (_: any, { email, password }: any) => {
      const user = await User.findOne({ email })
      if (!user) throw new Error('Invalid credentials')

      const valid = await user.comparePassword(password)
      if (!valid) throw new Error('Invalid credentials')

      const tokens = generateTokens(user.id, user.role)
      return { ...tokens, user }
    },

    refreshToken: async (_: any, { token }: any) => {
      try {
        const decoded: any = jwt.verify(
          token,
          process.env.JWT_REFRESH_SECRET as string
        )
        const user = await User.findById(decoded.userId)
        if (!user) throw new Error('User not found')

        const tokens = generateTokens(user.id, user.role)
        return { ...tokens, user }
      } catch {
        throw new Error('Invalid or expired refresh token')
      }
    }
  }
}