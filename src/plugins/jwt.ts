import fp from 'fastify-plugin'
import fastifyJwt from '@fastify/jwt'
import { FastifyRequest, FastifyReply } from 'fastify'

export default fp(async (fastify) => {
  const key = process.env.JWT_SECRET
  if (!key){
    fastify.log.info('没有找到JWT_SECRET')
  }

  fastify.register(fastifyJwt, {
    secret: `${key}`,
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
