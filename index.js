const mysql = require('mysql2')
const { promisify } = require('util')
const fs = require('fs').promises
const rub = 2.5

const connection = mysql.createConnection({
	host: 'localhost',
	port: 3306,
	user: 'admin',
	password: 'secret',
	database: 'store1',
})

// Promisify the query method to use async/await syntax
const queryAsync = promisify(connection.query).bind(connection)

async function insertNewProduct(categoryIdarr) {
	const pdsJson = await parseJSONFromFile('products.txt')


	pdsJson.forEach(async pd => {
		console.log(pd.title)

		try {
			// Your product data
			const newProductData = {
				model: pd.title,
				sku: 'SKU123',
				upc: 'UPC123',
				ean: 'EAN123',
				jan: 'JAN123',
				isbn: 'ISBN123',
				mpn: 'MPN123',
				location: 'Warehouse',
				quantity: 100,
				stock_status_id: 7,
				image: pd.images[0],
				manufacturer_id: 1,
				shipping: 1,
				price: (parseInt(pd.price) * rub),
				points: 0,
				tax_class_id: 9,
				date_available: new Date().toISOString().slice(0, 19).replace('T', ' '),
				weight: 1,
				weight_class_id: 1,
				length: 0,
				width: 0,
				height: 0,
				length_class_id: 1,
				subtract: 1,
				minimum: 1,
				sort_order: 1,
				status: 1,
				viewed: 0,
				date_added: new Date().toISOString().slice(0, 19).replace('T', ' '),
				date_modified: new Date().toISOString().slice(0, 19).replace('T', ' '),
			}

			// Insert the new product using OpenCart's product model
			const insertResult = await queryAsync('INSERT INTO oc_product SET ?', newProductData)

			console.log('New product inserted with ID:', insertResult.insertId)

			const newProductDataLanguageRu = {
				product_id: insertResult.insertId,
				language_id: '3',
				name: pd.title,
				description: pd.desc,
				tag: '',
				meta_title: pd.title,
				meta_description: '',
				meta_keyword: ''
			}

			const insertLanguageResultRu = await queryAsync('INSERT INTO oc_product_description SET ?', newProductDataLanguageRu)

			const newProductDataLanguageEn = {
				product_id: insertResult.insertId,
				language_id: '1',
				name: pd.title,
				description: pd.desc,
				tag: '',
				meta_title: pd.title,
				meta_description: '',
				meta_keyword: ''
			}

			const insertLanguageResultEn = await queryAsync('INSERT INTO oc_product_description SET ?', newProductDataLanguageEn)

			console.log('New product lang Ru inserted description;  affectedRows:', insertLanguageResultRu.affectedRows)

			console.log('New product lang En inserted description;  affectedRows:', insertLanguageResultEn.affectedRows)

			for (let i = 1; i < (pd.images.length - 1); i++) {
				const newProductDataImages = {
					product_id: insertResult.insertId,
					image: pd.images[i],
					sort_order: 0
				}
				const insertImagesResult = await queryAsync('INSERT INTO oc_product_image SET ?', newProductDataImages)

				console.log('New product lang inserted images', insertImagesResult.insertId)
			}


			const newProductDataToStore = {
				product_id: insertResult.insertId,
				store_id: 0
			}

			const insertToStoreResult = await queryAsync('INSERT INTO oc_product_to_store SET ?', newProductDataToStore)

			console.log('New product to Store Result; affectedRows:', insertToStoreResult.affectedRows)

			categoryIdarr.forEach(async (cat) => {
				const newProductDataCategory = {
					product_id: insertResult.insertId,
					category_id: cat
				}

				const insertCategoryResult = await queryAsync('INSERT INTO oc_product_to_category SET ?', newProductDataCategory)

				console.log('New product to Category Result; affectedRows:', insertCategoryResult.affectedRows)
			})


		} catch (error) {
			console.error('Error inserting new product:', error)
		}
	})
}

async function parseJSONFromFile(filePath) {
	try {
		const jsonData = await fs.readFile(filePath, 'utf8')
		const parsedData = JSON.parse(jsonData)
		return parsedData
	} catch (error) {
		console.error('Error parsing JSON from file:', error)
		return null
	}
}

insertNewProduct([106])