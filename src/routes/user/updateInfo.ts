import { FastifyPluginAsync } from 'fastify'
import { updateInfo } from '../../types/user'
import { updateUserInfo, getUserInfo } from '../../services/userService'
import { uploadAvatar } from '../../services/qiniuService'

const updateInfoRoute: FastifyPluginAsync = async (fastify) => {
  // 支持base64图片上传的路由
  fastify.post<{ Body: { avatar: string } }>('/upload', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { avatar } = request.body
      if (!avatar) {
        return reply.status(400).send({ message: '没有上传头像数据' })
      }

      const userId = (request.user as any)?.userId
      if (!userId) {
        return reply.status(401).send({ message: '未登录或 token 无效' })
      }

      try {
        // 获取当前用户信息
        const currentUser = await getUserInfo(userId)
        
        // 处理base64数据，移除data:image/xxx;base64,前缀
        const base64Data = avatar.replace(/^data:image\/[a-zA-Z+]+;base64,/, '')
        
        // 将base64转换为Buffer
        const buffer = Buffer.from(base64Data, 'base64')
        
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
      
      // 如果头像是base64格式，则先上传获取URL
      if (updateData.avatar && updateData.avatar.startsWith('data:image/')) {
        try {
          const currentUser = await getUserInfo(userId)
          const base64Data = updateData.avatar.replace(/^data:image\/[a-zA-Z+]+;base64,/, '')
          const buffer = Buffer.from(base64Data, 'base64')
          const avatarUrl = await uploadAvatar(buffer, currentUser.username)
          updateData.avatar = avatarUrl
          fastify.log.info('头像base64已转换为URL:', avatarUrl)
        } catch (error) {
          fastify.log.error('头像上传失败:', error)
          delete (updateData as any).avatar // 上传失败则不更新头像，保持原有头像
        }
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
