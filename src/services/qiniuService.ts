import qiniu from 'qiniu'
// import { FastifyInstance } from 'fastify'

// let fastify: FastifyInstance
// export function setFastifyInstance(f: FastifyInstance) {
//   fastify = f
// }

const accessKey = process.env.QINIU_ACCESS_KEY!
const secretKey = process.env.QINIU_SECRET_KEY!
const bucket = process.env.QINIU_BUCKET!
const domain = process.env.QINIU_DOMAIN!

const mac = new qiniu.auth.digest.Mac(accessKey, secretKey)
const config = new qiniu.conf.Config()
// 设置华南区域
config.zone = qiniu.zone.Zone_z2
const bucketManager = new qiniu.rs.BucketManager(mac, config)
const formUploader = new qiniu.form_up.FormUploader(config)

export async function uploadAvatar(buffer: Buffer, username: string): Promise<string> {
  // 生成文件名：avatar/用户名.jpg
  const fileName = `avatar/${username}.jpg`
  
  try {
    // 删除旧头像（如果存在）
    await deleteFile(fileName).catch(() => {
      // 忽略删除失败的错误（文件可能不存在）
    })
    
    // 上传新头像
    const putPolicy = new qiniu.rs.PutPolicy({
      scope: `${bucket}:${fileName}`,
      returnBody: '{"key":"$(key)","hash":"$(etag)","fsize":$(fsize),"bucket":"$(bucket)"}'
    })
    
    const uploadToken = putPolicy.uploadToken(mac)
    const putExtra = new qiniu.form_up.PutExtra()
    
    return new Promise((resolve, reject) => {
      formUploader.put(uploadToken, fileName, buffer, putExtra, (err, body, info) => {
        if (err) {
          reject(err)
          return
        }
        
        if (info.statusCode === 200) {
          const avatarUrl = `${domain}/${fileName}`
          resolve(avatarUrl)
        } else {
          reject(new Error(`上传失败: ${info.statusCode}`))
        }
      })
    })
  } catch (error) {
    throw new Error(`头像上传失败: ${error}`)
  }
}

async function deleteFile(fileName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    bucketManager.delete(bucket, fileName, (err, respBody, respInfo) => {
      if (err) {
        reject(err)
        return
      }
      resolve()
    })
  })
}
