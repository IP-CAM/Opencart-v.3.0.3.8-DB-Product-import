const puppeteer = require('puppeteer')
const fs = require('fs').promises

async function getProductsFromPage(url) {
	const browser = await puppeteer.launch({ headless: "new" })
	const page = await browser.newPage()

	try {
		await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 })
		await page.waitForSelector('.catalog-products .simple-slider-list__image', { timeout: 90000 })

		const productLinks = await page.evaluate(() => {
			const links = Array.from(document.querySelectorAll('.catalog-products .simple-slider-list .simple-slider-list__item .simple-slider-list__link .simple-slider-list__image'))
			return links.map(link => {
				console.log(link.href)
				return link.href
			})
		})

		await browser.close()
		return productLinks
	} catch (error) {
		console.error('Error fetching page:', error)
		await browser.close()
		return []
	}
}

async function parseGridWithPagination(startingUrl, totalPages) {
	try {
		let tempPage = 0
		for (let page = 1; page <= totalPages; page++) {

			const pageUrl = `${startingUrl}/#offset=${tempPage}`
			const productLinks = await getProductsFromPage(pageUrl)
			console.log(page)
			const oldText = await fs.readFile(oldTextFilePath, 'utf-8')
			const combinedText = `${oldText}\n${productLinks.join('\n')}`

			await fs.writeFile('product-links.txt', combinedText, 'utf-8')
			tempPage = tempPage + 36
		}

		console.log('Parsed Finished!')
	} catch (error) {
		console.error('Error parsing grid:', error)
	}
}

const oldTextFilePath = 'product-links.txt'
const startingUrl = 'https://makeup.com.ua/categorys/339969'
const totalPages = 70 // Set the number of pages you want to scrape.

parseGridWithPagination(startingUrl, totalPages)