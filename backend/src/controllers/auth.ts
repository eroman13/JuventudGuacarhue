import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '7d';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: { status: 400, message: 'Email y contraseña requeridos' }
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        error: { status: 401, message: 'Credenciales inválidas' }
      });
    }

    if (!user.estado) {
      return res.status(401).json({
        error: { status: 401, message: 'Usuario desactivado' }
      });
    }

    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      return res.status(401).json({
        error: { status: 401, message: 'Credenciales inválidas' }
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        apellido: user.apellido,
        rol: user.rol,
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({
      error: { status: 500, message: 'Error en login' }
    });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, nombre, apellido } = req.body;

    if (!email || !password || !nombre || !apellido) {
      return res.status(400).json({
        error: { status: 400, message: 'Todos los campos son requeridos' }
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        error: { status: 409, message: 'El usuario ya existe' }
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nombre,
        apellido,
        rol: 'VIEWER',
      },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        apellido: user.apellido,
        rol: user.rol,
      },
    });
  } catch (error) {
    console.error('Error en registro:', error);
    return res.status(500).json({
      error: { status: 500, message: 'Error en registro' }
    });
  }
};

export const me = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        error: { status: 401, message: 'No autenticado' }
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        rol: true,
        telefono: true,
        avatar: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: { status: 404, message: 'Usuario no encontrado' }
      });
    }

    return res.json(user);
  } catch (error) {
    console.error('Error en me:', error);
    return res.status(500).json({
      error: { status: 500, message: 'Error al obtener usuario' }
    });
  }
};
