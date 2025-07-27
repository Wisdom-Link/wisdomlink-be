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
  const { username, password } = data
  const existingUser = await User.findOne({ username })
  if (existingUser) {
    throw new Error('用户名已存在')
  }
  const hashedPassword = await bcrypt.hash(password, 10)
  const newUser = new User({
    username,
    password: hashedPassword,
  })
  await newUser.save()
  // 同步到 ES
  const userDoc: userInfo = {
    username: newUser.username,
    motto: newUser.motto || '',
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
  const user = await User.findById(userId).lean()
  if (!user) throw new Error('用户不存在')
  return {
    username: user.username,
    motto: user.motto || '',
    avatar: user.avatar || '',
    taps: user.taps || [],
    level: user.level || 1,
    questionCount: user.questionCount || 0,
    answerCount: user.answerCount || 0,
    highQualityAnswerCount: user.highQualityAnswerCount || 0,
    questionChats: (user.questionChats || []).map((id: any) => id.toString()),
    answerChats: (user.answerChats || []).map((id: any) => id.toString()),
    posts: (user.posts || []).map((id: any) => id.toString())
  }
}

export async function updateUserInfo(userId: string, data: updateInfo) {
  // 先获取原有用户数据
  const originalUser = await User.findById(userId).lean()
  if (!originalUser) throw new Error('用户不存在')
  
  // 只更新非空字段
  const updateData: Partial<updateInfo> = {}
  if (data.username && data.username.trim()) updateData.username = data.username.trim()
  if (data.motto !== undefined && data.motto !== null) updateData.motto = data.motto
  if (data.avatar && data.avatar.trim()) updateData.avatar = data.avatar.trim()
  if (data.taps && Array.isArray(data.taps)) updateData.taps = data.taps
  
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    updateData,
    { new: true, lean: true }
  )
  if (!updatedUser) throw new Error('用户不存在')
  
  // 使用 ES 的 update API 只更新指定字段，添加错误处理
  try {
    const esUpdateData: any = {}
    if (updateData.username) esUpdateData.username = updatedUser.username
    if (updateData.motto !== undefined) esUpdateData.motto = updatedUser.motto || ''
    if (updateData.avatar) esUpdateData.avatar = updatedUser.avatar || ''
    if (updateData.taps) esUpdateData.taps = updatedUser.taps || []
    
    if (Object.keys(esUpdateData).length > 0) {
      await fastify.elasticsearch.update({
        index: 'users',
        id: updatedUser._id.toString(),
        doc: esUpdateData
      })
      console.log('ES 同步成功')
    }
  } catch (error) {
    console.error('ES 同步失败:', error)
    // ES 同步失败不影响主要功能，但需要记录日志
  }
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
  }})
  return result.hits.hits.map((hit: any) => hit._source)
}

