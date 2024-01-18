import { Elysia } from 'elysia'
import { db } from '../db/connection'
import { restaurants, users } from '../db/schema'

const app = new Elysia().post('/restaurantes', async ({ body, set }) => {
  const { restaurantName, name, email, phone } = body as any

  const [manager] = await db
    .insert(users)
    .values({
      name,
      email,
      phone,
      role: 'manager',
    })
    .returning({
      id: users.id,
    })

  await db.insert(restaurants).values({
    name: restaurantName,
    managerId: manager.id,
  })

  set.status = 204
})

app.listen(3333, () => {
  console.log('🔥 HTTP server running!')
})
