import { defineEventHandler } from 'h3'
import { graphOf } from '../../utils/http'

export default defineEventHandler(event => graphOf(event))
