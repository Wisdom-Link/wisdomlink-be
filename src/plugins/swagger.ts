// plugins/swagger.ts
import fp from 'fastify-plugin'
import swagger from '@fastify/swagger'
import swaggerUI from '@fastify/swagger-ui'

export default fp(async (fastify) => {
  fastify.register(swagger, {
    swagger: {
      info: {
        title: 'WisdomLink API',
        description: '后端接口文档',
        version: '1.0.0'
      }
    }
  })

  fastify.register(swaggerUI, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'full',
    },
  })
})
