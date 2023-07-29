const mysql = require('mysql2')
const { promisify } = require('util')

const connection = mysql.createConnection({
	host: 'localhost',
	port: 3306,
	user: 'admin',
	password: 'secret',
	database: 'store1',
})

// Promisify the query method to use async/await syntax
const queryAsync = promisify(connection.query).bind(connection)

async function insertNewProduct(pdName, categoryId) {
	try {
		// Your product data
		const newProductData = {
			model: pdName,
			sku: 'SKU123',
			upc: 'UPC123',
			ean: 'EAN123',
			jan: 'JAN123',
			isbn: 'ISBN123',
			mpn: 'MPN123',
			location: 'Warehouse',
			quantity: 100,
			stock_status_id: 7,
			image: 'placeholder.jpg',
			manufacturer_id: 1,
			shipping: 1,
			price: 29.99,
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

		const newProductDataLanguage = {
			product_id: insertResult.insertId,
			language_id: '3',
			name: pdName,
			description: pdName,
			tag: '',
			meta_title: pdName,
			meta_description: '',
			meta_keyword: ''
		}

		const insertLanguageResult = await queryAsync('INSERT INTO oc_product_description SET ?', newProductDataLanguage)

		console.log('New product lang inserted description;  affectedRows:', insertLanguageResult.affectedRows)

		const newProductDataImages = {
			product_id: insertResult.insertId,
			image: 'placeholder.jpg',
			sort_order: 0
		}

		for (let i = 0; i < 3; i++) {
			const insertImagesResult = await queryAsync('INSERT INTO oc_product_image SET ?', newProductDataImages)

			console.log('New product lang inserted images', insertImagesResult.insertId)
		}


		const newProductDataToStore = {
			product_id: insertResult.insertId,
			store_id: 0
		}

		const insertToStoreResult = await queryAsync('INSERT INTO oc_product_to_store SET ?', newProductDataToStore)

		console.log('New product to Store Result; affectedRows:', insertToStoreResult.affectedRows)


		const newProductDataCategory = {
			product_id: insertResult.insertId,
			category_id: categoryId
		}

		const insertCategoryResult = await queryAsync('INSERT INTO oc_product_to_category SET ?', newProductDataCategory)

		console.log('New product to Category Result; affectedRows:', insertCategoryResult.affectedRows)

	} catch (error) {
		console.error('Error inserting new product:', error)
	} finally {
		connection.end()
	}
}

insertNewProduct('NewImagesPd3', 20)
