import { FastifyReply, FastifyRequest } from "fastify";
import prisma from "../../../utils/prisma";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();

if (!process.env.API_KEY) {
    throw new Error("API KEY NECESSARIA!");
}

const requestCounts: Record<string, { count: number; lastTime: number }> = {};
const MAX_REQUESTS = 3;
const COOLDOWN = 5 * 1000;

export default async function getGames(req: FastifyRequest, res: FastifyReply) {
    const apiKey = req.headers["x-api-key"];
    if (!apiKey || apiKey !== process.env.API_KEY) {
        res.status(401).send({ message: "Acesso negado." });
        return;
    }

    try{
        const games = await prisma.game.findMany()
    
    
        if (games.length === 0){
            return res.status(404).send({message:"Nenhum jogo encontrado."})
        }else{
            return res.status(200).send({message: "Sucesso",games: games})
        }
    }catch(e){
        console.log(e)
        res.status(400).send({message:"Erro inesperado."})
    }
}