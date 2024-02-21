import { integer, pgTable, text } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'
import { orders, products } from '.'

export const orderItems = pgTable('order_items', {
  id: text('id')
    .$defaultFn(() => createId())
    .primaryKey(),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.id, {
      onDelete: 'cascade',
    }),
  productId: text('product_id').references(() => products.id, {
    onDelete: 'set default',
  }),
  priceInCents: integer('price_in_cents').notNull(),
  quantity: integer('quantity').notNull(),
})
