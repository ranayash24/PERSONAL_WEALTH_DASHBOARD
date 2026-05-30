import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { loginSchema } from '@/lib/validators'

const nextAuth = NextAuth({
  adapter: PrismaAdapter(db),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const validated = loginSchema.safeParse(credentials)
          if (!validated.success) return null

          const { email, password } = validated.data

          const user = await db.user.findUnique({
            where: { email: email.toLowerCase() },
          })

          if (!user || !user.password) return null

          const passwordMatch = await bcrypt.compare(password, user.password)
          if (!passwordMatch) return null

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          }
        } catch {
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string | null
      }
      return session
    },
  },
})

export const { handlers, signIn, signOut } = nextAuth

const DEMO_SESSION = {
  user: { id: 'demo-user-id', email: 'demo@wealthiq.com', name: 'Demo User', image: null },
  expires: '2099-01-01T00:00:00.000Z',
}

// In demo mode: auth() returns mock session; auth(handler) wraps middleware with mock session injected.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const auth: any =
  process.env.DEMO_MODE === 'true'
    ? (handlerOrUndefined?: any) => {
        if (typeof handlerOrUndefined === 'function') {
          return (req: any, ...args: any[]) => {
            req.auth = DEMO_SESSION
            return handlerOrUndefined(req, ...args)
          }
        }
        return Promise.resolve(DEMO_SESSION)
      }
    : nextAuth.auth
