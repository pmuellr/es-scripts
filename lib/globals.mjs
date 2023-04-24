import 'zx/globals'

import * as http from './http.mjs'
import * as util from './util.mjs'

Object.assign(global, http, util)
