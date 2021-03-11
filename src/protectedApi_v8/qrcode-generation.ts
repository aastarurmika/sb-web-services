import axios from 'axios'
import { Router } from 'express'
import { axiosRequestConfig } from '../configs/request.config'
import { CONSTANTS } from '../utils/env'
import { logInfo } from '../utils/logger'
import { extractUserIdFromRequest } from '../utils/requestExtract'

const API_END_POINTS = {
  badge: `${CONSTANTS.SB_EXT_API_BASE_2}/v3/users`,
  certificateQRGenerator : `${CONSTANTS.CERTIFICATE_QR_GENERATOR_URL}`,
  getUserRegistry: `${CONSTANTS.USER_PROFILE_API_BASE}/public/v8/profileDetails/getUserRegistry`,
}

const GENERAL_ERROR_MSG = 'Failed due to unknown reason'
const NO_COURSE = 'No course available'

export const generateQRCodeApi = Router()

generateQRCodeApi.post('/', async (req, res) => {
  const userId = extractUserIdFromRequest(req)
  logInfo('Get user registry for QRCode', userId)
  try {

    // course
    const rootOrg = req.header('rootOrg')
    const langCode = req.header('locale')
    const url = `${API_END_POINTS.badge}/${userId}/badges`
    let courseName = ''
    let courseDate = ''

    const coursedetails = await axios.get(url, {
      ...axiosRequestConfig,
      headers: { rootOrg, langCode },
    })

    if (coursedetails.data.earned.length > 0) {
      const course = coursedetails.data.earned.filter((b: any) => b.badge_id === req.body.course)
      courseName = course[0].badge_name
      courseDate = course[0].last_received_date
    } else {
      return res.status(400).send({error: NO_COURSE})
    }

    // personal details
    const userdetails = await axios.post(API_END_POINTS.getUserRegistry, { userId }, {
      ...axiosRequestConfig,
    })

    const fn = userdetails.data[0].personalDetails.firstname
    const ln = userdetails.data[0].personalDetails.surname

    const obj = {
      course: courseName.charAt(0).toUpperCase() + courseName.slice(1),
      date: courseDate,
      firstName: fn.charAt(0).toUpperCase() + fn.slice(1),
      lastName: ln.charAt(0).toUpperCase() + ln.slice(1),
      wid: userId,
    }

    const response = await axios({
        ...axiosRequestConfig,
        data: obj,
        headers: { 'x-api-key': CONSTANTS.CERTIFICATE_QR_GENERATOR_API_KEY },
        method: 'POST',
        url: API_END_POINTS.certificateQRGenerator,
    })

    return res.send({data : response.data})
  } catch (err) {
    return res.status((err && err.response && err.response.status) || 400).send(
      (err && err.response && err.response.data) || {
        error: GENERAL_ERROR_MSG,
      }
    )
  }
})
