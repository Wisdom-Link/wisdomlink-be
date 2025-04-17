import { FastifyPluginAsync } from 'fastify'

const exam: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get('/', async function (request, reply) {
    
    return 'this is'
  })
}

export default exam