import axios from 'axios'
import { Router } from 'express'
import { axiosRequestConfig } from '../configs/request.config'
import { CONSTANTS } from '../utils/env'
import { logInfo } from '../utils/logger'
import { extractUserIdFromRequest } from '../utils/requestExtract'

const API_END_POINTS = {
  certificateQRGenerator : `${CONSTANTS.CERTIFICATE_QR_GENERATOR_URL}`,
}

const GENERAL_ERROR_MSG = 'Failed due to unknown reason'

export const generateQRCodeApi = Router()

generateQRCodeApi.post('/', async (req, res) => {
  const userId = extractUserIdFromRequest(req)
  logInfo('Get user registry for QRCode', userId)
  try {

    const obj = {
      course: req.body.course,
      date: req.body.date,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      wid: userId,
    }

    const response = await axios({
            ...axiosRequestConfig,
            data: obj,
            headers: { 'x-api-key': CONSTANTS.CERTIFICATE_QR_GENERATOR_API_KEY },
            method: 'POST',
            url: API_END_POINTS.certificateQRGenerator,

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
