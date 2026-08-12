import { prisma } from '../config/prisma';
import { comparePassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';
import { LoginInput } from '../validators/auth.validator';

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user || !user.isActive) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const passwordMatches = await comparePassword(input.password, user.password);
  if (!passwordMatches) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const token = signToken({ userId: user.id, role: user.role, email: user.email });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw AppError.notFound('User not found');
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
