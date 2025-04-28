import { FastifyPluginAsync } from 'fastify';
import { UserRegisterBody } from '../../types/user'
import User from '../../models/user'; 
import bcrypt from 'bcrypt';

const registerRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post<{
    Body: UserRegisterBody;
  }>('/register', async (request, reply) => {
    const { username, password, gender, birthday } = request.body;

    try {
      // 检查用户名是否已存在
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return reply.status(400).send({ message: '用户名已存在' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      // 创建用户
      const newUser = new User({
        username,
        password: hashedPassword,
        gender,
        birthday,
      });

      await newUser.save();
      reply.send({ message: '注册成功' });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ message: '注册失败' });
    }
  });
};

export default registerRoute;
