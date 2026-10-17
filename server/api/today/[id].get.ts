import { graphOf, langOf } from '../../utils/http'
import { today } from '../../utils/rules'

export default defineEventHandler(event => today(graphOf(event), langOf(event)))
