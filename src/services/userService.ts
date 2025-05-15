import User from '../models/user'
import bcrypt from 'bcrypt'
import { UserRegisterBody, updateInfo, userInfo } from '../types/user'
import { FastifyInstance } from 'fastify'

// 需要 fastify 实例以访问 elasticsearch
let fastify: FastifyInstance
export function setFastifyInstance(f: FastifyInstance) {
  fastify = f
}

export async function registerUser(data: UserRegisterBody) {
  const { username, password, gender, birthday } = data
  const existingUser = await User.findOne({ username })
  if (existingUser) {
    throw new Error('用户名已存在')
  }
  const hashedPassword = await bcrypt.hash(password, 10)
  const newUser = new User({
    username,
    password: hashedPassword,
    gender,
    birthday,
  })
  await newUser.save()
  // 同步到 ES
  const userDoc: userInfo = {
    username: newUser.username,
    motto: newUser.motto || '',
    gender: newUser.gender,
    avatar: newUser.avatar || '',
    taps: newUser.taps || [],
    level: newUser.level || 1,
    questionCount: newUser.questionCount || 0,
    answerCount: newUser.answerCount || 0,
    highQualityAnswerCount: newUser.highQualityAnswerCount || 0,
    questionChats: (newUser.questionChats || []).map((id: any) => id.toString()),
    answerChats: (newUser.answerChats || []).map((id: any) => id.toString()),
    posts: (newUser.posts || []).map((id: any) => id.toString())
  }
  await fastify.elasticsearch.index({
    index: 'users',
    id: newUser._id.toString(),
    document: userDoc
  })
  return newUser
}

export async function loginUser(username: string, password: string) {
  // 用 MongoDB 查找（因为密码加密，ES不适合查密码）
  const user = await User.findOne({ username })
  if (!user) throw new Error('用户不存在')
  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) throw new Error('密码错误')
  return user
}

export async function getUserInfo(userId: string): Promise<userInfo> {
  // 用 ES 查找
  const result = await fastify.elasticsearch.get({
    index: 'users',
    id: userId
  }).catch(() => null)
  if (!result || !result.found) throw new Error('用户不存在')
  return result._source as userInfo
}

export async function updateUserInfo(userId: string, data: updateInfo) {
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    data,
    { new: true, lean: true }
  )
  if (!updatedUser) throw new Error('用户不存在')
  // 同步到 ES
  const userDoc: userInfo = {
    username: updatedUser.username,
    motto: updatedUser.motto || '',
    gender: updatedUser.gender,
    avatar: updatedUser.avatar || '',
    taps: updatedUser.taps || [],
    level: updatedUser.level || 1,
    questionCount: updatedUser.questionCount || 0,
    answerCount: updatedUser.answerCount || 0,
    highQualityAnswerCount: updatedUser.highQualityAnswerCount || 0,
    questionChats: (updatedUser.questionChats || []).map((id: any) => id.toString()),
    answerChats: (updatedUser.answerChats || []).map((id: any) => id.toString()),
    posts: (updatedUser.posts || []).map((id: any) => id.toString())
  }
  await fastify.elasticsearch.index({
    index: 'users',
    id: updatedUser._id.toString(),
    document: userDoc
  })
  return updatedUser
}

export async function deleteUserByUsername(username: string) {
  const deleted = await User.findOneAndDelete({ username })
  if (!deleted) throw new Error('用户不存在')
  // 从 ES 删除
  await fastify.elasticsearch.delete({
    index: 'users',
    id: deleted._id.toString()
  }).catch(() => {})
  return deleted
}

// 用户搜索（用ES）
export async function searchUser(q: string) {
  const result = await fastify.elasticsearch.search({
    index: 'users',
    query: {
      multi_match: {
        query: q,
        fields: ['username', 'motto', 'taps']
      }
    }
  })
  return result.hits.hits.map((hit: any) => hit._source)
}
