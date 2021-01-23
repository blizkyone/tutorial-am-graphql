import { GraphQLServer, PubSub } from 'graphql-yoga'
// import dotenv from 'dotenv'
import db from './db.js'
import Query from './resolvers/Query.js'
import Mutation from './resolvers/Mutation.js'
import User from './resolvers/User.js'
import Post from './resolvers/Post.js'
import Comment from './resolvers/Comment.js'
import Subscription from './resolvers/Subscriptions.js'
const pubsub = new PubSub()
import { RedisPubSub } from 'graphql-redis-subscriptions'
// const pubsub = new RedisPubSub()

const server = new GraphQLServer({
   typeDefs: './src/schema.graphql',
   resolvers: {
      Query,
      Mutation,
      Subscription,
      Post,
      User,
      Comment,
   },
   context: (req) => ({
      db,
      pubsub,
      req,
   }),
})
server.start(() => console.log('The server is live'))
