import puppeteer from "puppeteer"
import { Category, ItemTeaser, ItemDetail } from '../models/models'

export const getCategories = async function(): Promise<Category[]> {
	const browser = await puppeteer.launch()
	const page = await browser.newPage()
	await page.goto("https://www.govdeals.com/")
	await page.waitForSelector(`a#cat_link`)

	return page.evaluate(() => {
		let categories: Category[] = []
		const anchors = document.getElementsByTagName(`a`)
		for (var i = 0; i < anchors.length; i++) {
			const link = anchors[i]
				if (link.id == "cat_link") {
					let category = {
						name: link.innerHTML,
						linkToCategoryItems: link.href,
						websiteCategoryId: "https://www.govdeals.com/" + link.innerHTML,
						itemDetails: []
					}
					categories.push(category)
				}
			}
		return categories
	})
}

export const getCategoryItemTeasers = async function(page: puppeteer.Page): Promise<ItemTeaser[]> {
	return page.evaluate(() => {
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

export const getItemDetail = async function(page: puppeteer.Page): Promise<ItemDetail> {
	return page.evaluate(() => {
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
			itemDetail.websiteSpecificId = itemDetail.itemTitle + itemDetail.endTime
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

export async function scrapeItemDetailsForCategory(category: Category): Promise<ItemDetail[]> {
	const browser = await puppeteer.launch()
	let page = await browser.newPage()

	await page.goto(category.linkToCategoryItems)
	await page.waitForSelector(`#result_col_2`)
	const pageLinksForCategory = await getPageLinksForCategory(page)
	
	const itemDetailSubResults = await Promise.all(pageLinksForCategory.map(async pageLink => {
		const currentCategoryPage = await browser.newPage()
		await currentCategoryPage.goto(pageLink)
		return scrapeCategoryPage(currentCategoryPage, category, browser)
	}))

	await browser.close()
	return itemDetailSubResults.flat()
}

async function scrapeCategoryPage(page: puppeteer.Page, category: Category, browser: puppeteer.Browser): Promise<ItemDetail[]> {
	let categoryItemTeasers = await getCategoryItemTeasers(page)
	const newCategoryTeasers = categoryItemTeasers.map(teaser => {
		let newTeaser = Object.assign({}, teaser)
		newTeaser.category = category.name
		return newTeaser
	})

	const itemDetails = await Promise.all(categoryItemTeasers.map(async function(teaser, i) {
		let page = await browser.newPage()
		await page.setDefaultNavigationTimeout(0); 
		await page.goto(teaser.linkToItemDetails)
		await page.waitForSelector(`#bid_tbl`)
		return await getItemDetail(page)
	}))
	
	return itemDetails
}

async function scrapePageLinksForCategory(page: puppeteer.Page): Promise<string[]> {
	 return page.evaluate(() => {
		let pageLinksForCategory: string[] = []
		const pageLinksContainer = document.getElementById("pagination_1")
		if (pageLinksContainer != null) {
			const anchors = pageLinksContainer.getElementsByTagName(`a`)
			const nonRelevantIndexes = [0, anchors.length-1, anchors.length-2]
			for (let i = 1; i < anchors.length-2; i++){
				pageLinksForCategory.push(anchors[i].href)
			}
		}
		return pageLinksForCategory
	})
}

async function getPageLinksForCategory(page: puppeteer.Page): Promise<string[]> {
	const pageLinks = [page.url()]
	const otherPageLinks = await scrapePageLinksForCategory(page)
	return [...pageLinks, ...otherPageLinks]
}