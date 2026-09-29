const express = require('express')
const cors = require('cors')

const app = express()
const academyRouter = require('./routes/academyRoutes')
const authRouter = require('./routes/authRoutes')
const fileRouter = require('./routes/fileRoutes')
const studentRouter = require('./routes/studentRoutes')
const examRouter = require('./routes/examRoutes')
const messageLogRouter = require('./routes/messageLogRoutes')
const errorHandler = require('./middlewares/errorHandler')

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/academies', academyRouter)
app.use('/academy', academyRouter)
app.use('/auth', authRouter)
app.use('/files', fileRouter)
app.use('/students', studentRouter)
app.use('/exams', examRouter)
app.use('/message-logs', messageLogRouter)
app.use('/classes', classRouter)

// 에러 처리 미들웨어를 마지막에 등록해야 함
app.use(errorHandler)

module.exports = app
