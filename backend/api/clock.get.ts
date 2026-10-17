import { defineEventHandler } from 'h3'
import { clock } from '../utils/data'

export default defineEventHandler(() => clock())
