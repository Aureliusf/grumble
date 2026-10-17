import { defineEventHandler } from 'h3'
import { langOf } from '../utils/http'
import { fundView } from '../utils/state'

export default defineEventHandler(event => fundView(langOf(event)))
