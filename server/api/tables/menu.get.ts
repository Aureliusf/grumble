import { defineEventHandler } from 'h3'
import { langOf } from '../../utils/http'
import { menu } from '../../utils/menu'

export default defineEventHandler(event => menu(langOf(event)))
