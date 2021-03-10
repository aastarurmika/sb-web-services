import axios from 'axios'
import { Router } from 'express'
import { axiosRequestConfig } from '../configs/request.config'
import { CONSTANTS } from '../utils/env'
import { extractUserIdFromRequest } from '../utils/requestExtract'
import { logInfo } from '../utils/logger'

const API_END_POINTS = {
  certificateQRGenerator : `${CONSTANTS.CERTIFICATE_QR_GENERATOR_URL}`
}

const GENERAL_ERROR_MSG = 'Failed due to unknown reason'

export const generateQRCodeApi = Router()

generateQRCodeApi.post('/', async (req, res) => {
  const userId = extractUserIdFromRequest(req)
  logInfo('Get user registry for QRCode', userId)
  try {
   
    const obj = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      course: req.body.course,
      date: req.body.date,
      wid: userId
    }

    const response = await axios({
            ...axiosRequestConfig,
            method: 'POST',
            url: API_END_POINTS.certificateQRGenerator,
            headers: { 'x-api-key': CONSTANTS.CERTIFICATE_QR_GENERATOR_API_KEY },
            data: obj
    })
   
    return res.send(response.data)
  } catch (err) {
    return res.status((err && err.response && err.response.status) || 400).send(
      (err && err.response && err.response.data) || {
        error: GENERAL_ERROR_MSG,
      }
    )
  }
})



