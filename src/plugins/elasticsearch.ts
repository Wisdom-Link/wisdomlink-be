import fp from 'fastify-plugin'
import { Client } from '@elastic/elasticsearch'

export default fp(async (fastify, opts) => {
  const client = new Client({
    node: process.env.ELASTICSEARCH_HOST
    // 可以根据需要添加认证等配置
  })
  fastify.decorate('elasticsearch', client)
})

