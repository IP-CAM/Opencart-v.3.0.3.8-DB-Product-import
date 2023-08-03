const puppeteer = require('puppeteer')
const fs = require('fs').promises
const axios = require('axios')

async function getProduct(url) {
	const browser = await puppeteer.launch({ headless: "new" })
	const page = await browser.newPage()

	try {
		await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 0 })
		await page.waitForSelector('#layout-main-wrap')
		await page.waitForSelector('#layout-main-wrap .sc-sz48g6-4 img')
		await page.waitForSelector('.styled__LinksWrapper-sc-caahyp-5 a')
		await page.waitForSelector('#layout-main-wrap #pd-price span')
		await page.waitForSelector('#layout-main-wrap #pd-description-text')
		await page.waitForSelector('#layout-main-wrap .sc-3sotvb-4.kSRNEJ')
		await page.waitForSelector('#layout-main-wrap .sc-3sotvb-2.iYvTNX')

		const categories = await page.evaluate(() => {
			const categoryElements = [...document.querySelectorAll('.styled__LinksWrapper-sc-caahyp-5 a')]
			return categoryElements.map((link) => link.innerHTML)
		})
		const descToTranslate = await page.evaluate(() => document.querySelector('#layout-main-wrap #pd-description-text').innerHTML)

		const splitDesc = await splitStringByLength(descToTranslate, 490)

		const sourceLanguage = 'en'
		const targetLanguage = 'ru'

		let descTranslated = []
		let stopPars = false

		for (const text of splitDesc) {
			try {
				const translatedText = await translateText(text, sourceLanguage, targetLanguage)
				if (translatedText) {
					descTranslated.push(translatedText)
					console.log('Translated text:', translatedText)
				}
				if (translatedText === 'error') {
					console.log('Translation failed for:', text)
					stopPars = true
					break
				}
			} catch (error) {
				console.error('Error occurred while translating:', error)
				stopPars = true
				break
			}
		}

		if (stopPars) {
			return 'stop-pars'
		}

		const readyDesc = descTranslated.join('')

		const product = {
			title: await page.evaluate(() => document.querySelector('#layout-main-wrap .sc-3sotvb-4.kSRNEJ').textContent),
			desc: readyDesc,
			price: await page.evaluate(() => document.querySelectorAll('#layout-main-wrap #pd-price span')[1].innerText.replace(/\s+/g, '')),
			cats: categories,
			image: await page.evaluate(() => document.querySelector('#layout-main-wrap [data-testid="main-image-wrapper"] img').getAttribute('src')),
			brand: await page.evaluate(() => document.querySelector('#layout-main-wrap .sc-3sotvb-2.iYvTNX').textContent),
			images: []
		}
		// await page.waitForSelector('.slick-slider .slick-slide')

		// const slides = await page.evaluate(() => document.querySelectorAll('.slick-slide'))
		// console.log(slides)
		// slides.forEach(async (e) => {
		// 	await page.hover(e)
		// 	await page.waitForTimeout(3000)
		// 	const newImg = await page.evaluate(() => document.querySelector('#layout-main-wrap [data-testid="main-image-wrapper"] img').getAttribute('src'))

		// 	product.images.push(newImg)
		// })



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
		return stringArray
	} catch (error) {
		console.error('Error occurred while reading the file:', error)
		return []
	}
}

async function translateText(text, sourceLang, targetLang) {
	try {
		const apiKey = '43399f2ee0ef065821d3' // You don't need an API key for the free tier of MyMemory API
		const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}&key=${apiKey}`

		const response = await axios.get(url)
		const translatedText = response.data.responseData.translatedText

		return translatedText
	} catch (error) {
		console.error('Error occurred while translating:', error.message)
		return 'error'
	}
}

async function parseProducts(productsFile, urlsFile) {
	try {
		const links = await readStringsFromFile(urlsFile)

		const products = []

		for (let link of links) {
			const productJson = await getProduct(link)
			if (productJson && productJson != 'stop-pars') {
				products.push(productJson)
			} else {
				break
			}
			console.log('Product parsed:', link)
		}

		await fs.writeFile(productsFile, JSON.stringify(products), 'utf-8')
		console.log('Parsed products Finished!')
	} catch (error) {
		console.error('Error parsing products:', error)
	}
}


async function splitStringByLength(str, maxLength) {
	const chunks = []
	let index = 0

	while (index < str.length) {
		chunks.push(str.substr(index, maxLength))
		index += maxLength
	}

	return chunks
}

const productsFile = 'products.txt'
const urlsFile = 'product-links.txt'

parseProducts(productsFile, urlsFile)
