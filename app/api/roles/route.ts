// @ts-nocheck
import { createCrudHandler } from '@/lib/crud'

export const { GET, POST, PUT, DELETE } = createCrudHandler({ table: 'roles', adminOnly: true })