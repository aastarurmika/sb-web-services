import axios from 'axios'
import { Router } from 'express'
import { axiosRequestConfig } from '../configs/request.config'
import { CONSTANTS } from '../utils/env'

export const verifyCertiQR = Router()

const GENERAL_ERROR_MSG = 'Failed due to unknown reason'

verifyCertiQR.get('/', async (req, res) => {

  // get params
  const query = req.query.q
  // logInfo('Verify  QRCode')

  try {
   const response = await axios({
            ...axiosRequestConfig,
            method: 'GET',
            params: {q: query},
            url: CONSTANTS.CERTIFICATE_QR_VERIFY_URL,
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
