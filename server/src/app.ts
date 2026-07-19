import express from 'express'
import cors from 'cors'
import { config } from './config/config'
import { connectDb } from './db'
import { connectRedis } from './config/redis'
import AuthRoute from './routes/auth.route'
import CurrencyRoute from './routes/currency.route'
import ExchangeRateRoute from './routes/exchange-rate.route'
import UploadPhotoRoute from './routes/upload-photo.route'
import PaymentRoute from './routes/payment-method.route'
import TransactionRoute from './routes/transaction.route'
import UserRoute from './routes/user.route'
import RateHistoryRoute from './routes/rate-history.route'
import RateHistorySnapshotRoute from './routes/exchange-rate-snapshot.route'
import ConversionRoute from './routes/conversion.route'
import errorHandler from './middlewares/error-handler'

const app = express()

// const whitelist = [
//     'http://localhost:5173',
//     'http://localhost:5174',
//     config.CLIENT_URL
//   ].filter(Boolean);
  

// const corsOptions = {
//     origin: function (origin: any, callback: any) {
//         if (!origin) return callback(null, true); 
//         if (whitelist.includes(origin)) {
//             callback(null, true); 
//         } else {
//             callback(new Error('Not allowed by CORS'));
//         }
//     },
//     credentials: true,
//     exposedHeaders: ["x-access-token", "x-refresh-token"],
// };

app.use(cors({}))
// app.use(cookieParser())

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true, limit:"16kb"}))
app.use(express.static("public"))
app.set("trust proxy", 1);
app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

const BaseURL = '/api/v1'

app.use(`${BaseURL}/auth`, AuthRoute)
app.use(`${BaseURL}/user`, UserRoute)
app.use(`${BaseURL}/currency`, CurrencyRoute)
app.use(`${BaseURL}/exchange-rate`, ExchangeRateRoute)
app.use(`${BaseURL}/upload`,UploadPhotoRoute)
app.use(`${BaseURL}/payment`,PaymentRoute)
app.use(`${BaseURL}/transaction`,TransactionRoute)
app.use(`${BaseURL}/rate-history`,RateHistoryRoute)
app.use(`${BaseURL}/rate-chart`,RateHistorySnapshotRoute)
app.use(`${BaseURL}/conversion`,ConversionRoute)

app.use(errorHandler)

const PORT =  config.PORT

const startServer = async () => {
  try {
    await connectDb();
    await connectRedis();

    app.listen(PORT, () => {
      console.log(`Server is running on PORT ${PORT}`);
    });

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

export {app};