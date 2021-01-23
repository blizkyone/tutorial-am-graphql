import asyncForEach from '../utils/asyncForEach.js'
import auth from '../utils/auth.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const Mutation = {
   authenticateUser: async (parent, args, { db }, info) => {
      const user = await db.Users.findOne({ email: args.data.email })
      if (!user) throw new Error('No user found')
      let isMatch = await bcrypt.compare(args.data.password, user.password)

      if (!isMatch) throw new Error('Invalid password')
      const token = jwt.sign(
         { _id: user._id.toString() },
         process.env.JWT_SECRET
      )
      user.tokens = user.tokens.concat({ token })
      await user.save()

      return { token, user }
   },
   createUser: async (parent, args, { db }, info) => {
      if (args.data.password.length < 6)
         throw new Error('Password must be at least 6 characters long')
      const emailTaken = await db.Users.findOne({
         email: args.data.email,
      })
      if (emailTaken) throw new Error('Email taken')

      const user = new db.Users({
         ...args.data,
      })

      const token = jwt.sign(
         { _id: user._id.toString() },
         process.env.JWT_SECRET
      )
      user.tokens = user.tokens.concat({ token })

      await user.save()

      return { token, user }
   },
   deleteUser: async (parent, args, { db }, info) => {
      const userToDelete = await db.Users.findById(args.id)
      if (!userToDelete) throw new Error('No user found')

      const postsToDelete = await db.Posts.find({ author: args.id }).lean()
      if (postsToDelete) {
         await asyncForEach(postsToDelete, async (post) => {
            await db.Comments.deleteMany({ post: post._id })
         })
         await db.Posts.deleteMany({ author: args.id })
      }

      const comments = await db.Comments.deleteMany({ author: args.id })
      const user = await db.Users.findOneAndDelete(args.id)

      return user
   },
   updateUser: async (parent, args, { db, req }, info) => {
      const id = auth(req)
      const { data } = args
      const user = await db.Users.findById(id)
      if (!user) throw new Error('User not found')

      if (typeof data.email === 'string') {
         const emailTaken = await db.Users.findOne({ email: data.email })
         if (emailTaken) throw new Error('Email taken')
         user.email = data.email
      }

      if (typeof data.name === 'string') {
         user.name = data.name
      }

      if (typeof data.age !== 'undefined') {
         user.age = data.age
      }

      await user.save()

      return user
   },
   createPost: async (parent, args, { db, pubsub, req }, info) => {
      const userId = auth(req)

      const userExists = await db.Users.findById(userId)
      if (!userExists) throw new Error('User not found')

      const post = new db.Posts({
         ...args.data,
         author: userId,
      })

      await post.save()

      if (args.data.published) {
         pubsub.publish('post', {
            post: {
               mutation: 'CREATED',
               data: post,
            },
         })
      }

      return post
   },
   deletePost: async (parent, args, { db, pubsub }, info) => {
      const postToDelete = await db.Posts.findByIdAndDelete(args.id)
      if (!postToDelete) throw new Error('Post not found')

      await db.Comments.deleteMany({ post: args.id })

      if (postToDelete.published) {
         pubsub.publish('post', {
            post: {
               mutation: 'DELETED',
               data: postToDelete,
            },
         })
      }

      return postToDelete
   },
   updatePost: async (parent, args, { db, pubsub }, info) => {
      const { id, data } = args
      const post = await db.Posts.findById(id)
      const originalPost = { ...post._doc }

      if (!post) throw new Error('Post not found')

      if (typeof data.title === 'string') {
         post.title = data.title
      }

      if (typeof data.body === 'string') {
         post.body = data.body
      }

      if (typeof data.published === 'boolean') {
         post.published = data.published
         await post.save()

         if (originalPost.published && !post.published) {
            pubsub.publish('post', {
               post: {
                  mutation: 'DELETED',
                  data: originalPost,
               },
            })
         } else if (!originalPost.published && post.published) {
            pubsub.publish('post', {
               post: {
                  mutation: 'CREATED',
                  data: post,
               },
            })
         } else if (originalPost.published && post.published) {
            pubsub.publish('post', {
               post: {
                  mutation: 'UPDATED',
                  data: post,
               },
            })
         }
      } else if (post.published) {
         await post.save()
         pubsub.publish('post', {
            post: {
               mutation: 'UPDATED',
               data: post,
            },
         })
      } else {
         await post.save()
      }

      return post
   },
   createComment: async (parent, args, { db, pubsub }, info) => {
      const userExists = await db.Users.findById(args.data.author)
      const postExists = await db.Posts.findById(args.data.post)

      if (!userExists || !postExists)
         throw new Error('Unable to find user or post')

      const comment = new db.Comments({
         ...args.data,
      })

      comment.save()

      pubsub.publish(`comment ${args.data.post}`, {
         comment: {
            mutation: 'CREATED',
            data: comment,
         },
      })

      return comment
   },
   deleteComment: async (parent, args, { db, pubsub }, info) => {
      const commentToDelete = await db.Comments.findByIdAndDelete(args.id)
      if (!commentToDelete) throw new Error('Comment not found')

      pubsub.publish(`comment ${commentToDelete.post}`, {
         comment: {
            mutation: 'DELETED',
            data: commentToDelete,
         },
      })
      return commentToDelete
   },
   updateComment: async (parent, args, { db, pubsub }, info) => {
      const { id, data } = args
      if (typeof data.text !== 'string')
         throw new Error('Update must be a string')
      const comment = await db.Comments.findByIdAndUpdate(
         id,
         { text: data.text },
         { new: true }
      )
      if (!comment) throw new Error('Comment not found')

      pubsub.publish(`comment ${comment.post}`, {
         comment: {
            mutation: 'UPDATED',
            data: comment,
         },
      })

      return comment
   },
}

export default Mutation
