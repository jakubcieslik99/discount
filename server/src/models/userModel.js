import { Schema, model } from 'mongoose'

const userSchema = new Schema(
  {
    email: { type: String, required: true },
    nick: { type: String, required: true },
    password: { type: String, required: true },
    token: { type: String /* | null*/ },
    confirmed: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
)

const userModel = model('User', userSchema)

export default userModel
