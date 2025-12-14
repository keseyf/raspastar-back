import { FastifyReply, FastifyRequest } from "fastify";
import { jwt, prisma } from "../../../utils/utils";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();

if(!process.env.API_KEY){
    throw new Error("API KEY NECESSARIA!");
}

if(!process.env.JWT_KEY){
    throw new Error("JWT KEY NECESSARIA!");
}

const requestCounts: Record<string, { count: number; lastTime: number }> = {};
const MAX_REQUESTS = 3
const COOLDOWN = 5 * 1000

export default async function login(req: FastifyRequest, res: FastifyReply){
    // Validacoes básicas
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
                res.status(429).send({ message: `Você está indo rápido demais, tente novamente mais tarde.` });
                return;
            }
        }
        requestCounts[ip].lastTime = now;
    }

    // Logica principal
    const {email, password} = req.body as {email: string, password:string}

    if(!email){
        return res.status(400).send({message:"Campo de Email não preenchido."})
    }
    if(!password){
        return res.status(400).send({message:"Campo de senha não preenchido."})
    }
    try{

        const user = await prisma.user.findMany({
            where:{email}
        })
    
        if(!user || user.length === 0 || user == undefined){
            return res.status(400).send({message: "Úsuario não encontrado, verifique o campo de email."})
        }
    
        const samePasswords = await bcrypt.compare(password, user[0].password)
        
        if(!samePasswords){
            return res.status(400).send({message: "Senha e usuário não coincidem."})
        }

        const token = jwt.sign(user[0],String(process.env.JWT_KEY))
        return res.status(200).send({message:"Entrando na conta...", token})
    }catch(e){
        console.log(e)
        return res.status(400).send({message: "Erro inesperado"})
    }
}