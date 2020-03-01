import { prismaObjectType, makePrismaSchema } from 'nexus-prisma'

export const WebsitePrismaObject = prismaObjectType({
  name: 'Website',
  definition(t) {
    t.prismaFields(['*'])
  },
})

export const CategoryPrismaObject = prismaObjectType({
  name: 'Category',
  definition(t) {
    t.prismaFields(['*', 'itemDetails'])
  },
})

export const ItemDetailPrismaObject = prismaObjectType({
  name: 'ItemDetail',
  definition(t) {
    t.prismaFields(['*'])
  },
})