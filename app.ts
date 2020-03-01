import puppeteer from "puppeteer"
import { link } from "fs";

interface Category {
	categoryTitle: string
	linkToCategoryItems: string
}

interface ItemTeaser {
	itemTitle: string
	category?: string
	linkToItemDetails: string
	websiteSpecificId: string
}

interface ItemDetail {
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

const getCategories = async function(page: puppeteer.Page): Promise<Category[]> {
	await page.goto("https://www.govdeals.com/")
	await page.waitForSelector(`a#cat_link`)

	return await page.evaluate(() => {
		let categories: Category[] = []
		const anchors = document.getElementsByTagName(`a`)
		for (var i = 0; i < anchors.length; i++) {
			const link = anchors[i]
				if (link.id == "cat_link") {
					let category = {
						categoryTitle: link.innerHTML,
						linkToCategoryItems: link.href,
					}
					categories.push(category)
				}
			}
		return categories
	})
}

const getCategoryItemTeasers = async function(page: puppeteer.Page): Promise<ItemTeaser[]> {
	return await page.evaluate(() => {
		let auctionItemTeasers: ItemTeaser[] = []
		const itemLinkContainers = document.querySelectorAll("#result_col_2")
		itemLinkContainers.forEach(container => {
			const anchor = container.getElementsByTagName("a")[0]
			const listedId = container.querySelectorAll(".small")[0].innerHTML
			const websiteSpecificId = listedId + anchor.innerHTML.slice(0,4)
			let auctionItemTeaser = {
				itemTitle: anchor.innerHTML,
				linkToItemDetails: anchor.href,
				websiteSpecificId: websiteSpecificId,
			}
			auctionItemTeasers.push(auctionItemTeaser)
		})

		return auctionItemTeasers
	})
}

const getItemDetail = async function(page: puppeteer.Page): Promise<ItemDetail> {
	return await page.evaluate(() => {
		const itemDetail: ItemDetail = { photos: [] }
		const bidInfoContainer = document.getElementById("bid_tbl")
		if (bidInfoContainer != null) {
			const bidInfoRows = bidInfoContainer.querySelectorAll("tr")
			itemDetail.itemTitle = bidInfoRows[0].children[0].innerHTML
			bidInfoRows.forEach((row, rowIndex) => {
				switch (row.children[0].innerHTML) {
					case "Auction Ends":
						itemDetail.endTime = row.children[1].innerHTML
						break
					case "Buyer's Premium":
						itemDetail.buyerPaysExtraPercent = row.children[1].innerHTML
						break
					case "Starting Bid":
						itemDetail.startingBid = row.children[1].innerHTML
						break
					case "Current Bid":
						itemDetail.currentBid = row.children[1].innerHTML
						break
					case "Minimum Bid":
						itemDetail.nextAmountToBid = row.children[1].innerHTML	
						break					
				}
			})
		}
		const photosContainer = document.getElementById("thumbnail_list_id")
		if (photosContainer != null) {
			let photoElements = photosContainer.querySelectorAll("img")
			photoElements.forEach(photoElement => {
				if (itemDetail.photos != undefined) {
					itemDetail.photos.push(photoElement.src)
				}			
			})
		}
		return itemDetail
	})
}

async function main(): Promise<void> {
	const browser = await puppeteer.launch()
	let page = await browser.newPage()
	const categories = await getCategories(page)

	for (var i = 0; i < 1; i++){
		const category = categories[i]
		let page = await browser.newPage()
		await page.goto(category.linkToCategoryItems)
		await page.waitForSelector(`#result_col_2`)
		let categoryItemTeasers = await getCategoryItemTeasers(page)
		const newCategoryTeasers = categoryItemTeasers.map(teaser => {
			let newTeaser = Object.assign({}, teaser)
			newTeaser.category = category.categoryTitle
			return newTeaser
		})

		const itemDetails = await Promise.all(categoryItemTeasers.map(async function(teaser, i) {
			let page = await browser.newPage()
			await page.goto(teaser.linkToItemDetails)
			await page.waitForSelector(`#bid_tbl`)
			return await getItemDetail(page)
		}))
		console.log('itemDetails', itemDetails)
	}
	
	await browser.close()
}

main()