const mongoose = require('mongoose')
const Document = require('./models/Document.js')
require('dotenv').config()

const PORT = process.env.PORT || 5000
const MONGO_URL = process.env.MONGO_URI
// Mongo Connection
mongoose.connect(MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

const io = require('socket.io')(PORT, {
  cors: {
    origin: 'https://googledocs-clone.netlify.app',
    methods: ['GET', 'POST']
  }
})

const defaultValue = ''

io.on('connection', socket => {
  console.log('client is connected')
  socket.on('get-document', async documentId => {
    const document = await findOrCreateDocument(documentId)
    socket.join(documentId)
    socket.emit('load-document', document.data)

    socket.on('send-changes', delta => {
      socket.broadcast.to(documentId).emit('receive-changes', delta)
    })

    socket.on('save-document', async data => {
      await Document.findByIdAndUpdate(documentId, { data })
    })
  })
})

async function findOrCreateDocument (id) {
  if (id == null) return
  const document = await Document.findById(id)
  if (document) return document
  return await Document.create({ _id: id, data: defaultValue })
}