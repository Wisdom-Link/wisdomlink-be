import fp from 'fastify-plugin'
import { Client } from '@elastic/elasticsearch'

export default fp(async (fastify, opts) => {
  const client = new Client({
  node: process.env.ELASTICSEARCH_HOST,
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
    password: process.env.ELASTICSEARCH_PASSWORD || '123456',
  }
})
  fastify.decorate('elasticsearch', client)
})

