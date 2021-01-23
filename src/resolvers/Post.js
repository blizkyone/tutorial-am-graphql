const Post = {
   author(parent, args, { db }, info) {
      return db.Users.findById(parent.author)
   },
   comments(parent, args, { db }, info) {
      return db.Comments.find({ post: parent._id })
   },
}

export default Post
