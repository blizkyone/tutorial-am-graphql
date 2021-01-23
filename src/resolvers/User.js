import auth from '../utils/auth.js'

const User = {
   posts(parent, args, { db }, info) {
      return db.Posts.find({ author: parent._id })
   },
   comments(parent, args, { db }, info) {
      return db.Comments.find({ author: parent._id })
   },
   email(parent, args, { req }, info) {
      const userId = auth(req, false)
      if (parent.id === userId) {
         return parent.email
      }
      return null
   },
}

export default User
