import { FastifyReply, FastifyRequest } from "fastify";
import  prisma  from "../../../utils/prisma"
import dotenv from "dotenv";

dotenv.config();

if (!process.env.API_KEY) {
  throw new Error("API KEY NECESSÁRIA!");
}

export default async function getGameById(
  req: FastifyRequest,
  res: FastifyReply
) {
  try {
    const apiKey = req.headers["x-api-key"];
    if (!apiKey || apiKey !== process.env.API_KEY) {
      return res.status(401).send({ message: "Acesso negado." });
    }

    const { id } = req.params as { id?: string };
    const gameId = Number(id);

    if (!id || isNaN(gameId) || !Number.isInteger(gameId)) {
      return res
        .status(400)
        .send({ message: "Parâmetro 'id' inválido ou ausente." });
    }

    const game = await prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      return res
        .status(404)
        .send({ message: "Nenhum jogo encontrado com o ID fornecido." });
    }

    return res.status(200).send({message: "Sucesso ao capturar informacoes", gameInfo: game});
  } catch (error) {
    console.error("Erro em getGameById:", error);
    return res.status(500).send({ message: "Erro interno do servidor." });
  }
}
