import { ItemDetail, ItemDetailCreateInput, ItemDetailUpdateInput } from '../models/models'

export function getOldItemDetailsSet(itemDetails: ItemDetail[]): Set<string> {
	const currentItemDetails = new Set()
	itemDetails.forEach(itemDetail => {
		currentItemDetails.add(itemDetail.websiteSpecificId)
	})
	return currentItemDetails
}

export function splitItemDetails(newItemDetails: ItemDetail[], oldItemDetailsSet: Set<string>): [ItemDetailCreateInput[], ItemDetailUpdateInput[]] {
	let itemsToCreate: Array<ItemDetailCreateInput> = []
	let itemsToUpdate: Array<ItemDetailUpdateInput> = []
	newItemDetails.forEach(itemDetail => {
		const id = itemDetail.websiteSpecificId || ""
		if (id == "") {
			return
		}
		if(oldItemDetailsSet.has(id)) {
			const newItemDetailToUpdate: ItemDetailUpdateInput = getItemDetailUpdateInput(itemDetail)
			itemsToUpdate.push(newItemDetailToUpdate)

		} else {
			const newItemDetailToCreate: ItemDetailCreateInput = getItemDetailCreateInput(itemDetail)
			itemsToCreate.push(newItemDetailToCreate)
		}
	})

	return [itemsToCreate, itemsToUpdate]
}

export function getItemDetailCreateInput(itemDetail: ItemDetail): ItemDetailCreateInput {
	return {
		itemTitle: itemDetail.itemTitle,
		endTime: itemDetail.endTime,
		category: itemDetail.category,
		buyerPaysExtraPercent: itemDetail.buyerPaysExtraPercent,
		websiteSpecificId: itemDetail.websiteSpecificId,
		startingBid: itemDetail.startingBid,
		currentBid: itemDetail.currentBid,
		nextAmountToBid: itemDetail.nextAmountToBid,
		photos: { set: itemDetail.photos || []},
		description: itemDetail.description,
		location: itemDetail.location,
		seller: itemDetail.seller,
	}
}

export function getItemDetailUpdateInput(itemDetail: ItemDetail): ItemDetailUpdateInput {
	const data = getItemDetailCreateInput(itemDetail)
	return {
		data,
		where: {websiteSpecificId: itemDetail.websiteSpecificId || ""}
	}
}