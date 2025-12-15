import { FastifyReply, FastifyRequest } from "fastify";
import {prisma} from "../../../utils/prisma";
import dotenv from "dotenv"

dotenv.config()

if(!process.env.API_KEY){
    throw new Error("API KEY NECESSARIA!")
}

export default async function getUsers(req: FastifyRequest, res: FastifyReply) {
    const apiKey = req.headers["x-api-key"]

    if (apiKey !== process.env.API_KEY || !apiKey){
        res.send("Acesso negado.")
        return
    }
    try{
        const users = await prisma.user.findMany()
    
        if(!users){
            res.send("Nenhum usuario encontrado.")
            return
        }
        res.send({"users": users})
        return
    }catch(e){
        console.log(e)
        res.status(404).send("Não foi possivel realizar a requisição ao banco de dados.")
        return
    }
}