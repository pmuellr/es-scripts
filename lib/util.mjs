/** @type { (o: any) => string} */
export function J(o) { return JSON.stringify(o, null, 4) }

/** @type { (o: any) => string} */
export function Js(o) { return JSON.stringify(o) }

/** @type { <T>(o: T) => T} */
export function clone(o) { return JSON.parse(JSON.stringify(o)) }