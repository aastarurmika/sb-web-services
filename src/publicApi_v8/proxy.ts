import express from 'express'
import {
  proxyCreatorRoute,
} from '../utils/proxyCreator'

export const publicproxy = express.Router()

publicproxy.get('/', (_req, res) => {
  res.json({
    type: 'PROXIES Route',
  })
})

publicproxy.use(
  '/certiQRValidator',
  proxyCreatorRoute(express.Router(), 'https://m6p7088w2a.execute-api.ap-south-1.amazonaws.com/prod/certiQRValidator')
)

