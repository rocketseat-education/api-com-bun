import Elysia, { t } from 'elysia'
import { auth } from '../auth'
import { db } from '../../db/connection'
import { UnauthorizedError } from '../errors/unauthorized-error'
import { createSelectSchema } from 'drizzle-typebox'
import { orders, users } from '../../db/schema'
import { and, count, eq, getTableColumns, ilike } from 'drizzle-orm'

export const getOrders = new Elysia().use(auth).get(
  '/orders',
  async ({ getCurrentUser, query }) => {
    const { restauranteId } = await getCurrentUser()
    const { customerName, orderId, status, pageIndex } = query

    if (!restauranteId) {
      throw new UnauthorizedError()
    }

    const orderTableColumns = getTableColumns(orders)

    const baseQuery = db
      .select(orderTableColumns)
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
        .limit(10),
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
