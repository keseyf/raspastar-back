import { app } from "./app"

const port = Number(process.env.PORT || 4444)

app.listen({ port }, () => {
  console.log(`🔥 API rodando em http://localhost:${port}`)
})
