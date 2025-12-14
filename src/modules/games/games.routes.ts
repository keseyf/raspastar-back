import { FastifyReply, FastifyRequest } from "fastify";
import { app } from "../../app"
import getGames from "./controllers/getGames";
import createGame from "./controllers/createGame";
import getGameById from "./controllers/getGameById";
import gambling from "./controllers/gambling";

export default async function gamesRoutes() {

    // GET
    app.get("/api/v2/games/getAll", async (req: FastifyRequest, res:FastifyReply)=>{
        await getGames(req,res)
    })

    app.get("/api/v2/games/getById/:id", async (req: FastifyRequest, res:FastifyReply)=>{
        await getGameById(req,res)
    })

    // POST
    app.post("/api/v2/games/create", async (req: FastifyRequest, res:FastifyReply)=>{
        await createGame(req,res)
    })

    app.post("/api/v2/games/gambling",async (req: FastifyRequest, res:FastifyReply)=>{
        await gambling({req,res})
    })
}