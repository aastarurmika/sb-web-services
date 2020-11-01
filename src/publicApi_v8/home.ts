
import { Router } from 'express'

import { logError } from '../utils/logger'

import {searchV5} from '../protectedApi_v8/content'
const GENERAL_ERROR_MSG = 'Failed due to unknown reason'

export const homePage = Router()

homePage.get('/latestCourses', async (req, res) => {
  try {
    const filters = {
      request:
      {
        didYouMean: true,
        filters: {
          contentType: ['Course', 'Program'],
          lastUpdatedOn: ['month'],
          locale: ['en'],
        },
        pageSize: 20,
        query: '',
      },
    }

    const reqBody = {
      ...req.body,
      request: {
        ...filters.request,
        rootOrg: req.header('rootOrg'),
        uuid:  'ec2687b9-7b86-4321-bbc7-8c9509b834ee',
      },
    }

    const response = await searchV5(reqBody)
    res.json(response)
  } catch (err) {
    logError('SEARCH API ERROR >', err)
    res.status((err && err.response && err.response.status) || 500).send(
      (err && err.response && err.response.data) || {
        error: GENERAL_ERROR_MSG,
      }
    )
  }
})

// homePage.get('/popularCourses', async (req, res) => {
//   try {

//   } catch (err) {
//     logError('HomePage API >', err)
//   }
// })

// publicTnc.get('/', async (req, res) => {
//   try {
//     const rootOrg = req.header('rootOrg') || ''
//     const org = req.header('org') || ''
//     let locale = 'en'
//     if (!org || !rootOrg) {
//       res.status(400).send(ERROR.ERROR_NO_ORG_DATA)
//       return
//     }
//     if (req.query.locale) {
//       locale = req.query.locale
//     }
//     const response = await axios({
//       ...axiosRequestConfig,
//       headers: {
//         langCode: locale,
//         org,
//         rootOrg,
//       },
//       method: 'GET',
//       url: apiEndpoints.tnc,
//     })
//     res.json(response.data)
//   } catch (err) {
//     logError('TNC ERR >', err)
//     res.status((err && err.response && err.response.status) || 500).send(
//       (err && err.response && err.response.data) || {
//         error: 'Failed due to unknown reason',
//       }
//     )
//   }
// })
