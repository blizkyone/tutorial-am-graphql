import jwt from 'jsonwebtoken'

const auth = (req, requireAuth = true) => {
   const header = req.request.headers.authorization

   if (header) {
      const token = header.replace('Bearer ', '')
      // const token = header.split(' ')[1]
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      return decoded._id
   }

   if (requireAuth) throw new Error('Authentication required')

   return null
}

export default auth
