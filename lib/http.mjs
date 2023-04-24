import * as https from 'node:https'
import * as path from 'node:path'

const ES_URL = process.env.ES_URL || "http://you-did-not-set-ES_URL-env-var"
const KB_URL= process.env.KB_URL || "http://you-did-not-set-KB_URL-env-var"

/** @type { <Response=any>(url: string) => Promise<Response> } */
export async function getEs(url)            { return fetchURL('GET',  path.join(ES_URL, url)) }
/** @type { <Request=any,Response=any>(url: string, body?: Request) => Promise<Response> } */
export async function postEs(url, body)     { return fetchURL('POST', path.join(ES_URL, url), body) }
/** @type { <Request=any,Response=any>(url: string, body?: Request) => Promise<Response> } */
export async function putEs(url, body)      { return fetchURL('PUT',  path.join(ES_URL, url), body) }
/** @type { <Request=any,Response=any>(url: string, body?: Request) => Promise<Response> } */
export async function deleteEs(url, body)   { return fetchURL('PUT',  path.join(ES_URL, url), body) }

/** @type { <Response=any>(url: string) => Promise<Response> } */
export async function getKb(url)           { return fetchURL('GET',  path.join(KB_URL, url)) }
/** @type { <Request=any,Response=any>(url: string, body?: Request) => Promise<Response> } */
export async function postKb(url, body)    { return fetchURL('POST', path.join(KB_URL, url), body) }
/** @type { <Request=any,Response=any>(url: string, body?: Request) => Promise<Response> } */
export async function putKb(url, body)     { return fetchURL('PUT',  path.join(KB_URL, url), body) }
/** @type { <Request=any,Response=any>(url: string, body?: Request) => Promise<Response> } */
export async function deleteKb(url, body)  { return fetchURL('PUT',  path.join(KB_URL, url), body) }

/** @type { <Request=any,Response=any>(method: string, urlWithPass: string, body?: Request) => Promise<Response> } */
export async function fetchURL(method, urlWithPass, body) {
  const purl = new URL(urlWithPass)
  const userPass = `${purl.username}:${purl.password}`
  const userPassEn = Buffer.from(userPass).toString('base64')
  const auth = `Basic ${userPassEn}`
  const url = `${purl.origin}${purl.pathname}${purl.search}`
  const headers = {
    'content-type': 'application/json',
    'kbn-xsrf': 'foo',
    authorization: auth,
  }

  const fetchOptions = { method, headers }
  if (body) fetchOptions.body = JSON.stringify(body)

  if (purl.protocol === 'https:') {
    fetchOptions.agent = new https.Agent({ rejectUnauthorized: false })
  }

  if (process.env.DEBUG) {
    console.log(`fetch("${url}", ${JSON.stringify(fetchOptions, null, 4)}`)
  }

  const response = await fetch(url, fetchOptions)
  const object = await response.json()
  // console.log(`fetch(...): ${JSON.stringify(object, null, 4)}`)
  return object
}
