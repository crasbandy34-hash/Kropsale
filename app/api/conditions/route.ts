// @ts-nocheck
import { createCrudHandler } from '@/lib/crud'

export const { GET, POST, PUT, DELETE } = createCrudHandler({ table: 'condition', publicRead: true, writeRoles: ['Administrador', 'Vendedor'] })