const express = require("express")
const http = require("http")
const path = require("path")
const { Server } = require("socket.io")

const app = express()
const server = http.createServer(app)
const PORT = process.env.PORT || 3000

app.use(express.static(path.join(__dirname, "public")))

app.get("/{*path}", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"))
})

const io = new Server(server, {
  cors: {
    origin: "https://whatsapp-clone-9hh6.onrender.com",
  }
})

let usuariosConectados = []
const salas = ["futbol", "clase"]

io.on("connection", (socket) => {
  console.log("Usuario conectado:", socket.id)

  socket.on("usuario:entrar", (datosUsuario) => {
    const usuario = {
      socketId: socket.id,
      uid: datosUsuario.uid,
      nombre: datosUsuario.nombre,
      foto: datosUsuario.foto || null,
    }

    usuariosConectados.push(usuario)
    socket.join("general")

    socket.emit("usuarios:lista", usuariosConectados)
    socket.emit("salas:lista", salas)
    socket.broadcast.emit("usuario:conectado", usuario)
    io.to("general").emit("chat:sistema", `${usuario.nombre} se ha unido al chat`)
  })

  socket.on("sala:entrar", (nombreSala) => {
    const usuario = usuariosConectados.find(u => u.socketId === socket.id)

    salas.forEach(sala => socket.leave(sala))
    socket.join(nombreSala)
    io.to(nombreSala).emit("chat:sistema", `${usuario.nombre} se ha unido a ${nombreSala}`)
  })

  socket.on("sala:salir", (nombreSala) => {
    const usuario = usuariosConectados.find(u => u.socketId === socket.id)
    socket.leave(nombreSala)
    socket.join("general")
    io.to("general").emit("chat:sistema", `${usuario.nombre} ha vuelto al chat general`)
  })

  socket.on("chat:mensaje", ({ texto, sala, archivo }) => {
    const usuario = usuariosConectados.find(u => u.socketId === socket.id)

    io.to(sala).emit("chat:mensaje", {
      texto,
      nombre: usuario.nombre,
      foto: usuario.foto,
      sala,
      archivo: archivo || null,
       timestamp: new Date().toTimeString().slice(0, 5)
    })
  })

  socket.on("privado:mensaje", ({ texto, archivo, destinatarioUid }) => {
    const emisor = usuariosConectados.find(u => u.socketId === socket.id)
    const destinatario = usuariosConectados.find(u => u.uid === destinatarioUid)

    const mensaje = {
      texto,
      nombre: emisor.nombre,
      foto: emisor.foto,
      archivo: archivo || null,
      privado: true,
      emisorUid: emisor.uid,
      destinatarioUid,
      timestamp: new Date().toTimeString().slice(0, 5)
    }

    io.to(destinatario.socketId).emit("privado:mensaje", mensaje)
    io.to(emisor.socketId).emit("privado:mensaje", mensaje)
  })

  socket.on("chat:escribiendo", ({ estaEscribiendo, sala }) => {
    const usuario = usuariosConectados.find(u => u.socketId === socket.id)

    socket.broadcast.to(sala).emit("chat:escribiendo", {
      nombre: usuario.nombre,
      estaEscribiendo
    })
  })

  socket.on("privado:escribiendo", ({ estaEscribiendo, destinatarioUid }) => {
    const emisor = usuariosConectados.find(u => u.socketId === socket.id)
    const destinatario = usuariosConectados.find(u => u.uid === destinatarioUid)

    io.to(destinatario.socketId).emit("privado:escribiendo", {
      nombre: emisor.nombre,
      estaEscribiendo
    })
  })

  socket.on("disconnect", () => {
    const usuario = usuariosConectados.find(u => u.socketId === socket.id)
    if (usuario) {
      usuariosConectados = usuariosConectados.filter(u => u.socketId !== socket.id)
      io.emit("usuario:desconectado", { uid: usuario.uid })
      io.to("general").emit("chat:sistema", `${usuario.nombre} ha salido del chat`)
    }
    console.log("Usuario desconectado:", socket.id)
  })
})

server.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT}`)
})