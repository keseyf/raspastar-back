import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../../../utils/prisma"
import dotenv from "dotenv";
import jwt, { JwtPayload } from "jsonwebtoken";

dotenv.config();

const JWT_KEY = process.env.JWT_KEY;
const API_KEY = process.env.API_KEY;

if (!JWT_KEY) {
  throw new Error("JWT_KEY necessária no arquivo .env!");
}

if (!API_KEY) {
  throw new Error("API_KEY necessária no arquivo .env!");
}

export default async function getUserData(
  req: FastifyRequest,
  res: FastifyReply
) {
  const apiKey = req.headers["x-api-key"];
  const userToken = req.headers["x-user-token"] as string | undefined;

  if (!apiKey || apiKey !== API_KEY) {
    return res.status(403).send({ message: "Acesso negado." });
  }

  if (!userToken) {
    return res
      .status(400)
      .send({ message: "É necessário informar o token de usuário no header `x-user-token`." });
  }

  try {
    // ✅ Garantimos que JWT_KEY é string com "!"
    const decoded = jwt.verify(userToken, JWT_KEY!) as string | JwtPayload;

    // ✅ Verifica se é JwtPayload antes de acessar .id
    if (typeof decoded !== "object" || !("id" in decoded)) {
      return res.status(401).send({ message: "Token inválido." });
    }

    const userId = (decoded as JwtPayload).id as string;

    const usrdata = await prisma.user.findFirst({ where: { id: userId } });

    if (!usrdata) {
      return res.status(404).send({ message: "Usuário não encontrado." });
    }

    return res.status(200).send({message: "Usuario encontrado com sucesso!", usrdata});
  } catch (e) {
    console.error(e);
    return res.status(401).send({ message: "Token inválido ou expirado." });
  }
}
