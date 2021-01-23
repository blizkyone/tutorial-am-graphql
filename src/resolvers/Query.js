const Query = {
   users: async (parent, args, { db }, info) => {
      if (!args.query) {
         return db.Users.find({})
      }
      return db.Users.find({ name: { $regex: `${args.query}` } })
   },
   posts: async (parent, args, { db }, info) => {
      if (!args.query) {
         return db.Posts.find({})
      }

      return db.Posts.find({
         $or: [
            { title: { $regex: `${args.query}` } },
            { body: { $regex: `${args.query}` } },
         ],
      })
   },
   comments(parent, args, { db }, info) {
      if (!args.query) {
         return db.Comments.find({})
      }

      return db.Comments.find({ text: { $regex: `${args.query}` } })
   },
}

export default Query
