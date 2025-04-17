import fp from 'fastify-plugin'
import fastifyJwt from '@fastify/jwt'
import { FastifyRequest, FastifyReply } from 'fastify'

export default fp(async (fastify) => {
  fastify.register(fastifyJwt, {
    secret: 'your-secret-key',
  })
  
  fastify.decorate(
    'authenticate',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify()
      } catch (err) {
        reply.send(err)
      }
    }
  )
})
