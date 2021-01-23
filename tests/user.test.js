import { getFirstName } from '../src/utils/user.js'

test('should return first name when given full name', () => {
   const firstName = getFirstName('Paolo Lago')
   expect(firstName).toBe('Paolo')
   //    if (firstName !== 'Paolo')
   //       throw new Error(`Expected string Paolo, got ${firstName}`)
})
