#!/usr/bin/env npx zx

import '../lib/globals.mjs'

const SCRIPT = path.basename(__filename)
$.verbose = false

const connSpec = {
  name: `server log - ${SCRIPT}`,
  connector_type_id: '.server-log',
}

let conn = await postKb(`api/actions/connector`, connSpec)
console.log(`created connector: ${J(connSpec)} => ${J(conn)}\n`)
if (!conn.id) process.exit(1)

const ruleSpecEvery = {
  rule_type_id: 'example.pattern',
  name: `pattern - every - ${SCRIPT}`,
  schedule: {
    interval: '5s'
  },
  actions: [
    { group: 'default',   id: conn.id, params: { message: 'act: every  - {{alert.id}} active on run {{context.runs}} step {{context.patternIndex}} flapping: {{alert.flapping}}'}},
    { group: 'recovered', id: conn.id, params: { message: 'rec: every  - {{alert.id}} active on run {{context.runs}} step {{context.patternIndex}} flapping: {{alert.flapping}}'}}
  ],
  consumer: 'alerts',
  tags: [],
  notify_when: 'onActiveAlert',
  params: {
    patterns: {
      instA: ' a - a ',
      instB: ' - a '
    }
  }
}

const ruleSpecChange = {
  ...clone(ruleSpecEvery),
  name: `pattern - change - ${SCRIPT}`,
  notify_when: 'onActionGroupChange',
}

const message = ruleSpecChange.actions[0].params.message
ruleSpecChange.actions[0].params.message = message.replace(/every  /, 'change ')
ruleSpecChange.actions[1].params.message = message.replace(/every  /, 'change ')

const ruleEvery  = await postKb(`api/alerting/rule/`, ruleSpecEvery) 
console.log('created rule (notify on every run)\n', J(ruleEvery))

const ruleChange = await postKb(`api/alerting/rule/`, ruleSpecChange)
console.log('created rule (notify on status change)\n', J(ruleChange))