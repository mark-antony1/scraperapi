import puppeteer from "puppeteer"
import { prismaObjectType, makePrismaSchema } from 'nexus-prisma'
import * as path from 'path'
import { stringArg, intArg } from 'nexus'
import { GraphQLServer } from 'graphql-yoga'
import { prisma } from './generated/prisma-client'
import datamodelInfo from './generated/nexus-prisma'
import { WebsitePrismaObject, CategoryPrismaObject } from './api/prismaObjects'
import { CategoryWithItemDetails } from './api/fragments'
import { getCategories, getOldItemDetailsSet, scrapeItemDetailsForCategory, splitItemDetails } from './api/utils'

const Query = prismaObjectType({
  name: 'Query',
  definition(t) {
		t.prismaFields(['*'])
		t.field('fetchWebsiteByUrl', {
			type: WebsitePrismaObject,
			args: {
        url: stringArg(),
      },
      resolve: async (parent, { url }, ctx) => {
				return ctx.prisma.website({url: url})
      },
		})
	}
})

const Mutation = prismaObjectType({
  name: 'Mutation',
  definition(t) {
		t.prismaFields(['createWebsite', 'createCategory', 'updateWebsite', 'upsertCategory'])
		t.field('createAllCategoriesForWebsite', {
			type: WebsitePrismaObject,
			args: {
        url: stringArg(),
      },
      resolve: async (parent, { url }, ctx) => {
				const categories = await getCategories()
        return ctx.prisma.updateWebsite({where: {url: url}, data:{ categories: { create: categories}  }})
      },
		})
		t.field('updateItemsInCategory', {
			type: CategoryPrismaObject,
			args: {
				websiteCategoryId: stringArg()
			},
      resolve: async (parent, { websiteCategoryId }, ctx) => {
				const category = await ctx.prisma.category({websiteCategoryId}).$fragment(CategoryWithItemDetails)
				const itemDetails = await ctx.prisma.category({websiteCategoryId}).itemDetails()
				const oldItemDetailsSet = getOldItemDetailsSet(itemDetails)
				const newItemDetails = await scrapeItemDetailsForCategory(category)
				const finalItemDetailTuple = splitItemDetails(newItemDetails, oldItemDetailsSet)
        return ctx.prisma.updateCategory({
					where: {
						websiteCategoryId: category.websiteCategoryId
					}, 
					data: { 
						itemDetails: { create: finalItemDetailTuple[0], update: finalItemDetailTuple[1] } 
					}
				})
      },
		})
	} 
})



const schema = makePrismaSchema({
  types: [Query, Mutation, WebsitePrismaObject, CategoryPrismaObject],

  prisma: {
    datamodelInfo,
    client: prisma,
  },

  outputs: {
    schema: path.join(__dirname, './generated/schema.graphql'),
    typegen: path.join(__dirname, './generated/nexus.ts'),
  },
})

const server = new GraphQLServer({
  schema,
  context: { prisma },
})
server.start(() => console.log(`Server is running on http://localhost:4000`))
