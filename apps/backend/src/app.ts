import express from 'express';
import cors from 'cors'; // CORS 미들웨어를 사용하여 Cross-Origin 요청을 허용

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const academyRouter = require('./routes/academyRoutes');
const errorHandler = require('./middlewares/errorHandler');
app.use('/academies', academyRouter);
app.use('/academy', academyRouter);
// 에러 처리 미들웨어를 마지막에 등록해야 함
app.use(errorHandler);

export default app;