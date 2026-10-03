const express = require('express')
const cors = require('cors')

const app = express()
const academyRouter = require('./routes/academyRoutes')
const authRouter = require('./routes/authRoutes')
const fileRouter = require('./routes/fileRoutes')
const classRouter = require('./routes/classRoutes')
const counselingRouter = require('./routes/counselingRoutes')
const studentRouter = require('./routes/studentRoutes')
const examRouter = require('./routes/examRoutes')

const reportRouter = require('./routes/reportRoutes')
const messageLogRouter = require('./routes/messageLogRoutes')
const errorHandler = require('./middlewares/errorHandler')
const shareRouter = require('./routes/shareRoutes')
const templateRouter = require('./routes/templateRoutes')
const adminRouter = require('./routes/admin')

// 허용할 프론트 origin (쉼표로 여러 개 가능). 기본값은 Vite 개발 서버
const allowedOrigins = (process.env.FRONTEND_BASE_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(cors({ origin: allowedOrigins }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/academies', academyRouter)
app.use('/academy', academyRouter)
app.use('/auth', authRouter)
app.use('/files', fileRouter)
app.use('/students/:studentId/counselings', counselingRouter)
app.use('/students', studentRouter)
app.use('/exams', examRouter)
app.use('/reports', reportRouter)
app.use('/share', shareRouter)
app.use('/message-logs', messageLogRouter)
app.use('/templates', templateRouter)
app.use('/classes', classRouter)
app.use('/admin', adminRouter)

// 에러 처리 미들웨어를 마지막에 등록해야 함
app.use(errorHandler)

module.exports = app
