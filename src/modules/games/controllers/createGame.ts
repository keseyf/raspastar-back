import { FastifyReply, FastifyRequest } from "fastify";
import prisma from "../../../utils/prisma";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();

if (!process.env.API_KEY) {
    throw new Error("API KEY NECESSARIA!");
}


export default async function createGame(req: FastifyRequest, res: FastifyReply) {
    const apiKey = req.headers["x-api-key"];
    if (!apiKey || apiKey !== process.env.API_KEY) {
        res.status(401).send({ message: "Acesso negado." });
        return;
    }

    try {
        const { name, winTax, imageUrl, desc, gamePrice } = req.body as { name: string, winTax: number, imageUrl: string, desc: string, gamePrice: number }

        switch (true) {
            case !name: return res.status(400).send({ error: "Nome obrigatório" });
            case !winTax: return res.status(400).send({ error: "Taxa obrigatória" });
            case !imageUrl: return res.status(400).send({ error: "Imagem obrigatória" });
            case !desc: return res.status(400).send({ error: "Descrição obrigatória" });
            case !gamePrice: return res.status(400).send({ error: "Preço obrigatório" });
        }

        const game = await prisma.game.create({
            data:{
                name, winTax, imageUrl, desc, gamePrice
            }
        }).then((e)=>{return res.status(200).send({message:`Jogo com id (${e.id}) Criado com sucesso!`})}).catch((e)=>{return res.status(400).send({message: "Erro inesperado ao criar jogo!"}), console.log(e)})
    } catch (e: any) {
        console.error(e);
        res.status(500).send({ message: "Erro interno do servidor." });
    }
}
