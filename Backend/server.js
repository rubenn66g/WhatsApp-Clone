const express = require("express")
const http = require("http")
const { Server } = require("socket.io")

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: "*",
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
    if (!usuario) return

    salas.forEach(sala => socket.leave(sala))

    socket.join(nombreSala)
    io.to(nombreSala).emit("chat:sistema", `${usuario.nombre} se ha unido a ${nombreSala}`)
  })

  socket.on("sala:salir", (nombreSala) => {
    const usuario = usuariosConectados.find(u => u.socketId === socket.id)
    if (!usuario) return

    socket.leave(nombreSala)
    socket.join("general")
    io.to("general").emit("chat:sistema", `${usuario.nombre} ha vuelto al chat general`)
  })

  socket.on("chat:mensaje", ({ texto, sala, archivo }) => {
    const usuario = usuariosConectados.find(u => u.socketId === socket.id)
    if (!usuario) return

    io.to(sala).emit("chat:mensaje", {
      texto,
      nombre: usuario.nombre,
      foto: usuario.foto,
      sala,
      archivo: archivo || null
    })
  })

  socket.on("privado:mensaje", ({ texto, archivo, destinatarioUid }) => {
    const emisor = usuariosConectados.find(u => u.socketId === socket.id)
    const destinatario = usuariosConectados.find(u => u.uid === destinatarioUid)
    if (!emisor || !destinatario) return

    const mensaje = {
      texto,
      nombre: emisor.nombre,
      foto: emisor.foto,
      archivo: archivo || null,
      privado: true,
      emisorUid: emisor.uid,
      destinatarioUid,
    }

    io.to(destinatario.socketId).emit("privado:mensaje", mensaje)
    io.to(emisor.socketId).emit("privado:mensaje", mensaje)
  })

  socket.on("chat:escribiendo", ({ estaEscribiendo, sala }) => {
    const usuario = usuariosConectados.find(u => u.socketId === socket.id)
    if (!usuario) return

    socket.broadcast.to(sala).emit("chat:escribiendo", {
      nombre: usuario.nombre,
      estaEscribiendo
    })
  })

  socket.on("privado:escribiendo", ({ estaEscribiendo, destinatarioUid }) => {
    const emisor = usuariosConectados.find(u => u.socketId === socket.id)
    const destinatario = usuariosConectados.find(u => u.uid === destinatarioUid)
    if (!emisor || !destinatario) return

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

server.listen(3000, () => {
  console.log("Servidor en puerto 3000")
})