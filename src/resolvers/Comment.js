const Comment = {
   post(parent, args, { db }, info) {
      return db.Posts.findById(parent.post)
   },
   author(parent, args, { db }, info) {
      return db.Users.findById(parent.author)
   },
}

export default Comment
