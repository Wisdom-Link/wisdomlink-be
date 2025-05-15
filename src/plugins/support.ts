import { Client } from '@elastic/elasticsearch';
import 'fastify'
import fp from 'fastify-plugin'
import OpenAI from 'openai';

export interface SupportPluginOptions {
  // Specify Support plugin options here
}

// The use of fastify-plugin is required to be able
// to export the decorators to the outer scope
export default fp<SupportPluginOptions>(async (fastify, opts) => {
  fastify.decorate('someSupport', function () {
    return 'hugs'
  })
})

// When using .decorate you have to specify added properties for Typescript
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    openai: OpenAI;
    elasticsearch: Client;
  }
}
