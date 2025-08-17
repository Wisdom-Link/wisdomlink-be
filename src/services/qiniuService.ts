import qiniu from 'qiniu'
import { FastifyInstance } from 'fastify'

let fastify: FastifyInstance
export function setFastifyInstance(f: FastifyInstance) {
  fastify = f
  
  // 记录七牛云服务初始化
  fastify.log.info('七牛云服务已初始化', {
    hasAccessKey: !!accessKey,
    hasBucket: !!bucket,
    hasDomain: !!domain
  });
}

const accessKey = process.env.QINIU_ACCESS_KEY!
const secretKey = process.env.QINIU_SECRET_KEY!
const bucket = process.env.QINIU_BUCKET!
const domain = process.env.QINIU_DOMAIN!

// 验证环境变量
if (!accessKey || !secretKey || !bucket || !domain) {
  console.error('七牛云配置缺失，请检查环境变量：QINIU_ACCESS_KEY, QINIU_SECRET_KEY, QINIU_BUCKET, QINIU_DOMAIN');
}

const mac = new qiniu.auth.digest.Mac(accessKey, secretKey)
const config = new qiniu.conf.Config()
// 设置华南区域
config.zone = qiniu.zone.Zone_z2
const bucketManager = new qiniu.rs.BucketManager(mac, config)
const formUploader = new qiniu.form_up.FormUploader(config)

export async function uploadAvatar(buffer: Buffer, username: string): Promise<string> {
  // 生成文件名：avatar/用户名_时间戳.jpg（避免缓存问题）
  const timestamp = Date.now()
  const fileName = `avatar/${username}_${timestamp}.jpg`
  
  try {
    // 可选：删除旧头像（根据模式匹配）
    try {
      await deleteOldAvatars(username)
    } catch (error) {
      // 删除旧头像失败不影响上传新头像
      if (fastify) {
        fastify.log.warn('删除旧头像失败:', error);
      } else {
        console.warn('删除旧头像失败:', error);
      }
    }
    
    // 上传新头像
    const putPolicy = new qiniu.rs.PutPolicy({
      scope: `${bucket}:${fileName}`,
      returnBody: '{"key":"$(key)","hash":"$(etag)","fsize":$(fsize),"bucket":"$(bucket)","url":"$(key)"}'
    })
    
    const uploadToken = putPolicy.uploadToken(mac)
    const putExtra = new qiniu.form_up.PutExtra()
    
    return new Promise((resolve, reject) => {
      formUploader.put(uploadToken, fileName, buffer, putExtra, (err, body, info) => {
        if (err) {
          const errorMsg = `上传失败: ${err.message}`;
          if (fastify) {
            fastify.log.error('七牛云上传错误:', err);
          } else {
            console.error('七牛云上传错误:', err);
          }
          reject(new Error(errorMsg))
          return
        }
        
        if (info.statusCode === 200) {
          const avatarUrl = `${domain}/${fileName}`
          if (fastify) {
            fastify.log.info('头像上传成功:', { username, fileName, url: avatarUrl });
          } else {
            console.log('头像上传成功:', { username, fileName, url: avatarUrl });
          }
          resolve(avatarUrl)
        } else {
          const errorMsg = `上传失败，状态码: ${info.statusCode}`;
          if (fastify) {
            fastify.log.error('七牛云响应错误:', info);
          } else {
            console.error('七牛云响应错误:', info);
          }
          reject(new Error(errorMsg))
        }
      })
    })
  } catch (error: any) {
    if (fastify) {
      fastify.log.error('头像上传异常:', error);
    } else {
      console.error('头像上传异常:', error);
    }
    throw new Error(`头像上传失败: ${error.message}`)
  }
}

// 删除用户的旧头像文件
async function deleteOldAvatars(username: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // 列出该用户的所有头像文件
    const prefix = `avatar/${username}`
    const limit = 10 // 限制查询数量
    
    bucketManager.listPrefix(bucket, { prefix, limit }, (err, respBody, respInfo) => {
      if (err) {
        reject(err)
        return
      }
      
      if (respInfo.statusCode === 200 && respBody.items) {
        // 删除找到的文件
        const deletePromises = respBody.items.map((item: any) => deleteFile(item.key))
        Promise.all(deletePromises)
          .then(() => resolve())
          .catch(reject)
      } else {
        resolve() // 没有找到文件也算成功
      }
    })
  })
}

async function deleteFile(fileName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    bucketManager.delete(bucket, fileName, (err, respBody, respInfo) => {
      if (err) {
        reject(err)
        return
      }
      if (respInfo.statusCode === 200 || respInfo.statusCode === 612) {
        // 200: 删除成功，612: 文件不存在
        resolve()
      } else {
        reject(new Error(`删除失败，状态码: ${respInfo.statusCode}`))
      }
    })
  })
}

// 生成上传凭证（如果需要前端直传）
export function generateUploadToken(fileName?: string): string {
  const putPolicy = new qiniu.rs.PutPolicy({
    scope: fileName ? `${bucket}:${fileName}` : bucket,
    expires: 3600, // 1小时过期
    returnBody: '{"key":"$(key)","hash":"$(etag)","fsize":$(fsize),"bucket":"$(bucket)"}'
  })
  
  return putPolicy.uploadToken(mac)
}
