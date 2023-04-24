#!/usr/bin/env npx zx

import 'zx/globals'

const SCRIPT = path.basename(__filename)
$.verbose = false

const dataIndex = 'rule-task-state--dev'
const dataAlias = `metrics-${dataIndex}` // metrics rules look for metrics-* indices
const mappings = {
  properties: {
    '@timestamp': { type: 'date' },
    'network.packets': { type: 'long' },
    'network.name': { type: 'keyword' },
  },
}

let Active = true
let Flapping = false
let Conn
let MtRule
let ItRule

main()

async function main() {
  const createdIndex = await putEs(dataIndex, { mappings })
  console.log(`created index:            ${JSON.stringify(createdIndex)}`)

  // metrics only reads from metrics-* patterns by default, and
  // we can't easily create a metrics-<anything> index
  const alias = await putEs(`${dataIndex}/_alias/${dataAlias}`)
  console.log(`alias for metrics:        ${JSON.stringify(alias)}`)

  // write data @ 1s, alternating active / not active @ 5s
  setInterval(writeData, 1000)
  setInterval(setActive, 3000)

  const createConnPayload = {
    name: 'server log for rule-task-state',
    connector_type_id: '.server-log',
  }

  Conn = await postKb(`api/actions/connector`, createConnPayload)
  console.log(`server log id:            ${Conn.id}`)

  MtRule = await postKb(`api/alerting/rule`, getMtRulePayload())
  console.log(`metric threshold rule id: ${MtRule.id}`)

  ItRule = await postKb(`api/alerting/rule`, getItRulePayload())
  console.log(`index  threshold rule id: ${ItRule.id}`)
}

async function setActive() {
  let flapping = false
  let active = false

  if (!ItRule) return

  const alertSummary  = await getKb(`/internal/alerting/rule/${ItRule.id}/_alert_summary`)
  // console.log(J(alertSummary))
  if (alertSummary.statusCode) return

  const { alerts }  = alertSummary
  for (const [id, alert] of Object.entries(alerts)) {
    if (alert.flapping) flapping = true
    if (alert.status === 'Active') active = true
  }

  if (flapping) {
    Active = false
  } else {
    Active = !active
  }

  const activeS   = active   ? 't' : 'f'
  const flappingS = flapping ? 't' : 'f'
  console.log(`active: ${activeS}; flapping: ${flappingS} => Active: ${Active}`)
}

function writeData() {
  const date = new Date().toISOString()
  postEs(`${dataIndex}/_doc`, {
    '@timestamp': date,
    network: { name: 'host-A', packets: Active ? 1 : 0 },
  })
}

function getMtRulePayload() {
  return {
    consumer: 'infrastructure',
    name: 'rule-mt',
    schedule: {
      interval: '3s',
    },
    params: {
      criteria: [
        {
          aggType: 'max',
          comparator: '>',
          threshold: [0],
          timeSize: 3,
          timeUnit: 's',
          metric: 'network.packets',
        },
      ],
      sourceId: 'default',
      alertOnNoData: false,
      alertOnGroupDisappear: false,
      groupBy: ['network.name'],
    },
    rule_type_id: 'metrics.alert.threshold',
    notify_when: 'onActiveAlert',
    actions: [
      {
        group: 'metrics.threshold.fired',
        id: Conn.id,
        params: { message: `mt: active:    ${message}` },
      },
      {
        group: 'recovered',
        id: Conn.id,
        params: { message: `mt: recovered: ${message}` },
      },
    ],
  }
}

const message = '{{alert.id}} flapping: {{alert.flapping}}'

function getItRulePayload() {
  return {
    rule_type_id: '.index-threshold',
    name: 'rule-it',
    notify_when: 'onActiveAlert',
    consumer: 'alerts',
    schedule: { interval: '3s' },
    actions: [
      {
        group: 'threshold met',
        id: Conn.id,
        params: { message: `it: active:    ${message}` },
      },
      {
        group: 'recovered',
        id: Conn.id,
        params: { message: `it: recovered: ${message}` },
      },
    ],
    params: {
      index: [dataIndex],
      timeField: '@timestamp',
      aggType: 'max',
      aggField: 'network.packets',
      groupBy: 'top',
      termSize: 100,
      termField: 'network.name',
      timeWindowSize: 3,
      timeWindowUnit: 's',
      thresholdComparator: '>',
      threshold: [0],
    },
  }
}
