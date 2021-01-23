import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

mongoose.connect(process.env.MONGODB_URL, {
   useNewUrlParser: true,
   useCreateIndex: true,
   useUnifiedTopology: true,
   useFindAndModify: false,
})

const userSchema = mongoose.Schema({
   name: {
      type: String,
      required: true,
   },
   email: {
      type: String,
      required: true,
   },
   password: String,
   age: Number,
   tokens: [
      {
         token: {
            type: String,
            required: true,
         },
      },
   ],
})

userSchema.pre('save', async function (next) {
   let user = this

   if (user.isModified('password')) {
      user.password = await bcrypt.hash(user.password, 10)
   }

   next()
})

const Users = mongoose.model('User', userSchema)

const postSchema = mongoose.Schema({
   title: {
      type: String,
      required: true,
   },
   body: {
      type: String,
      required: true,
   },
   published: {
      type: Boolean,
      required: true,
   },
   author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
   },
})

const Posts = mongoose.model('Post', postSchema)

const commentSchema = mongoose.Schema({
   text: {
      type: String,
      required: true,
   },
   author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
   },
   post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
   },
})

const Comments = mongoose.model('Comment', commentSchema)

const db = {
   Users,
   Posts,
   Comments,
}

export default db
