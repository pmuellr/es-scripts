import 'zx/globals'

import * as pathModule from 'node:path'

import * as http from './http.mjs'
import * as util from './util.mjs'

declare global {
  var path:     typeof pathModule
  var getEs:    typeof http.getEs
  var putEs:    typeof http.putEs
  var postEs:   typeof http.postEs
  var deleteEs: typeof http.deleteEs
  var getKb:    typeof http.getKb
  var putKb:    typeof http.putKb
  var postKb:   typeof http.postKb
  var deleteKb: typeof http.deleteKb
  var fetchURL: typeof http.fetchURL

  var J:     typeof util.J
  var Js:    typeof util.Js
  var clone: typeof util.clone
}