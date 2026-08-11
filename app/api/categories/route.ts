// @ts-nocheck
import { createCrudHandler } from '@/lib/crud'

export const { GET, POST, PUT, DELETE } = createCrudHandler({ table: 'category', publicRead: true, writeRoles: ['Administrador', 'Vendedor'] })