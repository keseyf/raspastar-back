import { app } from "../../utils/utils"
import createUser from "./controllers/createUser"
import getUsers from "./controllers/getUsers"
import { FastifyReply, FastifyRequest } from "fastify";
import login from "./controllers/login";
import getUserData from "./controllers/getUserData";


export default async function userRoutes() {
    // GET
    app.get("/api/v2/users", async (req: FastifyRequest, res: FastifyReply)=>{
        await getUsers(req, res)
    })

    app.get("/api/v2/users/profile/", async (req: FastifyRequest, res: FastifyReply)=>{
        await getUserData(req, res)
    })
    
    // POST
    app.post("/api/v2/users/create/", async (req: FastifyRequest,res:FastifyReply)=>{
        await createUser(req,res)
    })

    app.post("/api/v2/users/login", async (req: FastifyRequest,res:FastifyReply)=>{
        await login(req,res)
    })
}
