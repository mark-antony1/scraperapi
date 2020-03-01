export interface Category {
	name: string
	linkToCategoryItems: string
	websiteCategoryId: string
	itemDetails: ItemDetail[]
}

export interface ItemTeaser {
	itemTitle: string
	category?: string
	linkToItemDetails: string
	websiteSpecificId: string
}

export interface ItemDetail {
	itemTitle?: string
	endTime?: string
	category?: string
	buyerPaysExtraPercent?: string
	websiteSpecificId?: string
	startingBid?: string
	currentBid?: string
	nextAmountToBid?: string
	photos?: string[]
	description?: string
	location?: string
	seller?: string
}

export interface ItemDetailCreateInput {
	itemTitle?: string
	endTime?: string
	category?: string
	buyerPaysExtraPercent?: string
	websiteSpecificId?: string
	startingBid?: string
	currentBid?: string
	nextAmountToBid?: string
	photos?: photosCreateOrUpdateInput
	description?: string
	location?: string
	seller?: string
}

export interface ItemDetailUpdateInput {
	data: ItemDetailCreateInput
	where: ItemDetailWhereInput
}

export interface ItemDetailWhereInput {
	websiteSpecificId: string
}

export interface photosCreateOrUpdateInput {
	set: string[]
}