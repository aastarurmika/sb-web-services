
import axios from 'axios'
import { Router } from 'express'
import { axiosRequestConfig } from '../configs/request.config'
import { IContent } from '../models/content.model'
import { searchV5 } from '../protectedApi_v8/content'
import { logError } from '../utils/logger'
const GENERAL_ERROR_MSG = 'Failed due to unknown reason'
import { processContent } from '../utils/contentHelpers'

import { getFilters } from '../service/catalog'
import { CONSTANTS } from '../utils/env'
import { ERROR } from '../utils/message'
const API_END_POINTS = {
  searchV6: `${CONSTANTS.SEARCH_API_BASE}/v6/search`,
}
export const homePage = Router()

const adminId = 'ec2687b9-7b86-4321-bbc7-8c9509b834ee'
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
        uuid: adminId,
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

// searchv6

homePage.post('/searchV6', async (req, res) => {
  try {
    const body = {
      ...req.body,
      rootOrg: req.header('rootOrg'),
      uuid: adminId,
    }
    const response = await axios.post(API_END_POINTS.searchV6, body, axiosRequestConfig)
    const contents: IContent[] = response.data.result
    if (Array.isArray(contents)) {
      response.data.result = contents.map((content) => processContent(content))
    }
    res.json(
      response.data || {
        filters: [],
        filtersUsed: [],
        notVisibleFilters: [],
        result: [],
        totalHits: 0,
      }
    )
  } catch (err) {
    logError('SEARCH V6 API ERROR >', err)
    res.status((err && err.response && err.response.status) || 500).send(
      (err && err.response && err.response.data) || {
        error: GENERAL_ERROR_MSG,
      }
    )
  }
})

// catalog

homePage.get('/catalog', async (req, res) => {
  try {
    const userId = adminId
    const rootOrg = req.headers.rootorg
    if (!rootOrg) {
      res.status(400).send(ERROR.ERROR_NO_ORG_DATA)
      return
    }
    if (typeof rootOrg === 'string') {
      const filters = await getFilters(userId, rootOrg, 'catalogPaths')
      res.send(filters)
      return
    }

    res.status(400).send({ error: ERROR.ERROR_NO_ORG_DATA })
  } catch (err) {
    res.status((err && err.response && err.response.status) || 500).send(
      (err && err.response && err.response.data) || {

        error: 'Failed due to unknown reason',
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
