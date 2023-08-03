const puppeteer = require('puppeteer')
const fs = require('fs').promises

async function getProduct(url) {
	const browser = await puppeteer.launch({ headless: "new" })
	const page = await browser.newPage()

	try {
		await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 0 })

		try {
			await page.waitForSelector('.new-product-item .price_item', { timeout: 30000 })
		} catch (e) {
			console.log('price not found')
			await browser.close()
			return 'skip'
		}

		await page.waitForSelector('.new-product-item', { timeout: 90000 })
		await page.waitForSelector('.new-product-item #product-image .product-slider__item img', { timeout: 90000 })

		try {
			await page.waitForSelector('.new-product-item .product-item-tabs__content', { timeout: 90000 })
		} catch (e) {
			console.log('content not found')
		}

		try {
			await page.waitForSelector('.new-product-item .product-info__description', { timeout: 90000 })
		} catch (e) {
			console.log('description not found')
		}

		await page.waitForSelector('.new-product-item .product-item__name', { timeout: 90000 })
		await page.waitForSelector('.product-item [itemprop="name"]', { timeout: 90000 })

		let desc1 = ''
		try {
			desc1 = await page.evaluate(() => document.querySelector('.new-product-item .product-item-tabs__content').innerText)
		} catch (e) {
			console.log('content not found')
		}

		let desc2 = ''
		try {
			desc2 = await page.evaluate(() => document.querySelector('.new-product-item .product-info__description').innerHTML)
		} catch (e) {
			console.log('description not found')
		}

		const desc = desc1 + '\n' + desc2

		const images = await page.$$eval('.new-product-item #product-image .product-slider__item img', (imgs) => imgs.map((img) => img.getAttribute('src')))

		let price = ''

		try {
			price = await page.evaluate(() => document.querySelector('.new-product-item .price_item').innerText)
		} catch (e) {
			console.log('price not found')
			await browser.close()
			return 'skip'
		}

		const product = {
			title: await page.evaluate(() => document.querySelector('.new-product-item .product-item__name').textContent),
			desc: desc,
			price: price,
			images: images,
			brand: await page.evaluate(() => document.querySelector('.product-item [itemprop="name"]').textContent)
		}
		await browser.close()
		return product
	} catch (error) {
		console.error('Error fetching page:', error)
		await browser.close()
		return 'stop-pars'
	}
}

async function readStringsFromFile(filePath) {
	try {
		const fileData = await fs.readFile(filePath, 'utf8')
		const stringArray = fileData.trim().split('\n')
		const uniqueStringArray = await removeDuplicates(stringArray)

		return uniqueStringArray
		// return stringArray
	} catch (error) {
		console.error('Error occurred while reading the file:', error)
		return []
	}
}

async function removeDuplicates(arr) {
	let uniqueArray = []
	for (let i = 0; i < arr.length; i++) {
		if (!uniqueArray.includes(arr[i])) {
			uniqueArray.push(arr[i])
		}
	}
	return uniqueArray
}

async function parseProducts(productsFile, urlsFile) {
	try {
		const links = await readStringsFromFile(urlsFile)

		const products = []

		for (let [index, link] of links.entries()) {
			const productJson = await getProduct(link)
			if (productJson && productJson !== 'stop-pars') {
				products.push(productJson)
			} else if (productJson === 'skip') {
				// Do something when the productJson is 'skip'
			} else {
				break
			}
			console.log('Product parsed at index', index, ' of ', links.length, ':', link)
		}

		await fs.writeFile(productsFile, JSON.stringify(products), 'utf-8')
		console.log('Parsed products Finished!')
	} catch (error) {
		console.error('Error parsing products:', error)
	}
}

const productsFile = 'products.txt'
const urlsFile = 'product-links.txt'

parseProducts(productsFile, urlsFile)
