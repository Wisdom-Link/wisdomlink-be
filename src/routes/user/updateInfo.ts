import { FastifyPluginAsync } from 'fastify'
import { updateInfo } from '../../types/user'
import { updateUserInfo, getUserInfo } from '../../services/userService'
import { uploadAvatar } from '../../services/qiniuService'

const updateInfoRoute: FastifyPluginAsync = async (fastify) => {
  // 支持文件上传的路由
  fastify.post('/upload', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const data = await request.file()
      if (!data) {
        return reply.status(400).send({ message: '没有上传文件' })
      }

      const userId = (request.user as any)?.userId
      if (!userId) {
        return reply.status(401).send({ message: '未登录或 token 无效' })
      }

      try {
        // 获取当前用户信息
        const currentUser = await getUserInfo(userId)
        
        // 将文件流转换为 Buffer
        const buffer = await data.toBuffer()
        
        // 上传到七牛云
        const avatarUrl = await uploadAvatar(buffer, currentUser.username)
        
        reply.status(200).send({ 
          message: '上传成功',
          url: avatarUrl 
        })
      } catch (error) {
        fastify.log.error('头像上传失败:', error)
        return reply.status(400).send({ message: '头像上传失败' })
      }
    } catch (error: any) {
      fastify.log.error('文件上传失败:', error)
      reply.status(500).send({ message: '文件上传失败' })
    }
  })

  // 原有的更新用户信息路由
  fastify.put<{ Body: updateInfo }>('/updateInfo', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = (request.user as any)?.userId
      if (!userId) {
        return reply.status(401).send({ message: '未登录或 token 无效' })
      }

      const updateData = { ...request.body }
      
      // 检查头像字段，如果是临时文件路径则忽略
      if (updateData.avatar && (updateData.avatar.includes('/tmp/') || updateData.avatar.includes('temp'))) {
        fastify.log.warn('检测到临时文件路径，忽略头像更新:', updateData.avatar)
        delete updateData.avatar // 删除临时路径，不更新头像
      }
      
      // 添加调试日志
      fastify.log.info('更新用户信息请求数据:', updateData)
      
      const updatedUser = await updateUserInfo(userId, updateData)
      
      // 添加调试日志
      fastify.log.info('更新后的用户信息:', {
        username: updatedUser.username,
        avatar: updatedUser.avatar
      })
      
      const result: updateInfo = {
        username: updatedUser.username || '',
        motto: updatedUser.motto || '',
        taps: updatedUser.taps || [],
        avatar: updatedUser.avatar || '',
      }
      reply.status(200).send(result)
    } catch (error: any) {
      fastify.log.error(error)
      reply.status(500).send({ message: error.message || '服务器错误' })
    }
  })
}


export default updateInfoRoute;
