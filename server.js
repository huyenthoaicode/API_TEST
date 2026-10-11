const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const PAGE_SIZE = 3;
const TOKEN = 'mock-token-123';

// ===== Dữ liệu giả lập =====
// PriceList: ItemCode phải CÓ trong B20Item.Code
const PRICE_CODES = ['VNM','FPT','HPG','VCB','MWG','SSI','VIC','MSN','GAS','ACB'];
const PRICES = PRICE_CODES.map((c, i) => ({ Id: i + 1, ItemCode: c, Par_Val: 10000 }));

// Investor: CustomerCode phải CHƯA có trong B20Customer (chỉ thêm mới)
const CUS = Array.from({ length: 10 }, (_, i) => {
	const n = String(i + 1).padStart(3, '0');
	return {
		Id: i + 1,
		CustomerCode: '036CTEST' + n,
		Name: 'Nguyen Van Test ' + n,
		CustomerType: String(i % 3),          // 0,1,2 -> map qua MAPCORE_CUS
		CustomerCountry: 'C',
		Address: 'So ' + n + ' Pho Test, Ha Noi',
		Tel: i % 4 === 0 ? null : '09000000' + n.slice(-2),
		Birthday: '1980-01-' + String((i % 28) + 1).padStart(2, '0') + 'T00:00:00',
		IdCardNo: '0010800' + n,
		IdCardDate: '2015-05-05T00:00:00',
		IdCardPlace: 'Ha Noi'
	};
});

// Securities: ItemCode phải CHƯA có trong B20Item
// SectypeCd/TradePlace nên khớp B20MapCore (MAPCORE_ITEM, MAPCORE_ITEMGROUP, MAPCORE_LISTING) để test map
const SEC_TYPES = ['001', '002', '003'];
const SEC_PLACES = ['HOSE', 'HNX', 'UPCOM'];
const ITEMS = Array.from({ length: 10 }, (_, i) => {
	const n = String(i + 1).padStart(3, '0');
	return {
		Id: i + 1,
		ItemCode: 'TST' + n,
		ItemName: 'Chung khoan test ' + n,
		Unit: i % 2 === 0 ? 'CP' : 'TP',
		SectypeCd: SEC_TYPES[i % SEC_TYPES.length],
		TradePlace: SEC_PLACES[i % SEC_PLACES.length],
		Par_Val: 10000
	};
});

// ===== Tiện ích =====
function auth(req, res) {
	if (req.headers.authorization !== 'Bearer ' + TOKEN) {
		res.status(401).json({ error: 'unauthorized' });
		return false;
	}
	return true;
}

// Id trong body là con trỏ: trả các dòng có Id > con trỏ, tối đa PAGE_SIZE, kèm IdMax
function page(list, req, name) {
	const lastId = Number((req.body && req.body.Id) || 0);
	const rows = list.filter(r => r.Id > lastId).slice(0, PAGE_SIZE)
		.map(r => ({ IdMax: list.length, ...r }));
	console.log(name, 'DocDate', req.body && req.body.DocDate, 'Id', lastId, '=> rows', rows.length);
	return rows;
}

// ===== Routes =====
app.post('/token', (req, res) => {
	const { username, password, grant_type } = req.body;
	if (username !== 'test' || password !== 'test123' || grant_type !== 'password')
		return res.status(400).json({ error: 'invalid_username_or_password' });
	res.json({ access_token: TOKEN, token_type: 'bearer', expires_in: 3600 });
});

app.post('/price', (req, res) => { if (auth(req, res)) res.json(page(PRICES, req, 'price')); });
app.post('/cus',   (req, res) => { if (auth(req, res)) res.json(page(CUS, req, 'cus')); });
app.post('/item',  (req, res) => { if (auth(req, res)) res.json(page(ITEMS, req, 'item')); });

app.listen(process.env.PORT || 3000, () => console.log('mock api up'));
