import { FastifyReply, FastifyRequest } from "fastify";
import prisma from "../../../utils/prisma";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();

if (!process.env.API_KEY) {
  throw new Error("API KEY NECESSÁRIA!");
}

const requestCounts: Record<string, { count: number; lastTime: number }> = {};
const MAX_REQUESTS = 3;
const COOLDOWN = 5 * 1000; // 5 segundos

export default async function createUser(req: FastifyRequest, res: FastifyReply) {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    res.status(401).send({ message: "Acesso negado." });
    return;
  }

  const ip = req.ip;
  const now = Date.now();

  if (!requestCounts[ip]) {
    requestCounts[ip] = { count: 1, lastTime: now };
  } else {
    if (now - requestCounts[ip].lastTime > COOLDOWN) {
      requestCounts[ip] = { count: 1, lastTime: now };
    } else {
      requestCounts[ip].count += 1;
      if (requestCounts[ip].count > MAX_REQUESTS) {
        const wait = Math.ceil((COOLDOWN - (now - requestCounts[ip].lastTime)) / 1000);
        res.status(429).send({ message: `Você está indo rápido demais, tente novamente em ${wait}s.` });
        return;
      }
      requestCounts[ip].lastTime = now;
    }
  }

  try {
    let { name, email, cpf, password, username } = req.body as {
      name: string;
      email: string;
      cpf: string;
      password: string;
      username?: string;
    };

    if (!name || !email || !cpf || !password) {
      res.status(400).send({ message: "Faltam parâmetros a serem preenchidos." });
      return;
    }

    const regexUsername = /^(?!.*[_.]{2})(?![_.])[a-zA-Z0-9._]{3,30}(?<![_.])$/;
    const regexName = /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/;
    const regexEmail = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    const regexCpf = /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/;

    if (!regexName.test(name)) {
      res.status(400).send({ message: "Nome inválido: só pode conter letras e espaços." });
      return;
    }
    // Gerar username aleatório se não informado
    if (!username) {
      const adjectives = ["brave", "calm", "eager", "fancy", "gentle", "happy", "jolly", "kind", "lucky", "nice"];
      const nouns = ["lion", "tiger", "eagle", "shark", "panda", "wolf", "fox", "bear", "owl", "zebra"];
      const randomFromArray = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
      const randomNumber = Math.floor(Math.random() * 1000);
      username = `${randomFromArray(adjectives)}-${randomFromArray(nouns)}-${randomNumber}`;
    } else {
      if (!regexUsername.test(username)) {
        return res.status(400).send({
          message: "Nome de usuário inválido: use apenas letras, números, '.' ou '_', sem hífens ou símbolos consecutivos."
        });
      }
      const existingUsername = await prisma.user.findFirst({
        where: { username }
      });
      if (existingUsername) {
        return res.status(400).send({ message: "Nome de usuário já em uso." });
      }
    }

    if (!regexEmail.test(email)) {
      return res.status(400).send({ message: "Email inválido." });
    }

    if (!regexCpf.test(cpf)) {
      return res.status(400).send({ message: "CPF inválido: deve estar no formato 000.000.000-00 ou conter 11 dígitos." });
    }

    // Remove pontos e traços antes de usar
    const cleanCpf = cpf.replace(/[^\d]/g, '');

    if (cleanCpf.length !== 11) {
      return res.status(400).send({ message: "CPF inválido: deve conter 11 dígitos numéricos." });
    }

    if (password.length < 6) {
      res.status(400).send({ message: "Senha muito curta: mínimo 6 caracteres." });
      return;
    }

    const emailExists = await prisma.user.findUnique({ where: { email } });
    if (emailExists) {
      res.status(400).send({ message: "Email já cadastrado." });
      return;
    }

    const cpfExists = await prisma.user.findUnique({ where: { cpf } });
    if (cpfExists) {
      res.status(400).send({ message: "CPF já cadastrado." });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        cpf: cleanCpf,
        password: hashedPassword,
        username
      }
    });

    res.status(201).send({
      message: "Usuário criado com sucesso.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        cpf: user.cpf,
        username: user.username
      }
    });
  } catch (e: any) {
    console.error(e);
    res.status(500).send({ message: "Erro interno do servidor." });
  }
}
