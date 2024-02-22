import Elysia, { t } from 'elysia'
import { auth } from '../auth'
import { db } from '../../db/connection'
import { UnauthorizedError } from '../errors/unauthorized-error'
import { createSelectSchema } from 'drizzle-typebox'
import { orders, users } from '../../db/schema'
import { and, count, desc, eq, ilike, sql } from 'drizzle-orm'

export const getOrders = new Elysia().use(auth).get(
  '/orders',
  async ({ getCurrentUser, query }) => {
    const { restauranteId } = await getCurrentUser()
    const { customerName, orderId, status, pageIndex } = query

    if (!restauranteId) {
      throw new UnauthorizedError()
    }

    const baseQuery = db
      .select({
        orderId: orders.id,
        createdAt: orders.createdAt,
        status: orders.status,
        total: orders.totalInCents,
        customerName: users.name,
      })
      .from(orders)
      .innerJoin(users, eq(users.id, orders.customerId))
      .where(
        and(
          eq(orders.restaurantId, restauranteId),
          orderId ? ilike(orders.id, `%${orderId}%`) : undefined,
          status ? eq(orders.id, status) : undefined,
          customerName ? ilike(users.name, `%${customerName}%`) : undefined,
        ),
      )

    const [amountOfOrdersQuery, allOrders] = await Promise.all([
      db.select({ count: count() }).from(baseQuery.as('baseQuery')),
      db
        .select()
        .from(baseQuery.as('baseQuery'))
        .offset(pageIndex * 10)
        .limit(10)
        .orderBy((fields) => {
          return [
            sql`CASE ${fields.status}
              WHEN 'pending' THEN 1
              WHEN 'processing' THEN 2
              WHEN 'delivering' THEN 3
              WHEN 'delivered' THEN 4
              WHEN 'canceled' THEN 99
            END`,
            desc(fields.createdAt),
          ]
        }),
    ])

    const amountOfOrders = amountOfOrdersQuery[0].count

    return {
      orders: allOrders,
      meta: {
        pageIndex,
        perPage: 10,
        totalCount: amountOfOrders,
      },
    }
  },
  {
    query: t.Object({
      customerName: t.Optional(t.String()),
      orderId: t.Optional(t.String()),
      status: t.Optional(createSelectSchema(orders).properties.status),
      pageIndex: t.Numeric({ minimum: 0 }),
    }),
  },
)
