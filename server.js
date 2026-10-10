const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const PAGE_SIZE = 3;
// Đổi thành mã thật có trong B20Item.Code, nếu không INNER JOIN sẽ không ghi được dòng nào
const CODES = ['VNM','FPT','HPG','VCB','MWG','SSI','VIC','MSN','GAS','ACB'];
const ITEMS = CODES.map((c, i) => ({ Id: i + 1, ItemCode: c, Par_Val: 10000 }));

app.post('/token', (req, res) => {
	const { username, password, grant_type } = req.body;
	if (username !== 'test' || password !== 'test123' || grant_type !== 'password')
		return res.status(400).json({ error: 'invalid_username_or_password' });
	res.json({ access_token: 'mock-token-123', token_type: 'bearer', expires_in: 3600 });
});

app.post('/price', (req, res) => {
	if (req.headers.authorization !== 'Bearer mock-token-123')
		return res.status(401).json({ error: 'unauthorized' });
	const lastId = Number(req.body.Id || 0);
	const page = ITEMS.filter(i => i.Id > lastId).slice(0, PAGE_SIZE)
		.map(i => ({ IdMax: ITEMS.length, ...i }));
	console.log('DocDate', req.body.DocDate, 'Id', lastId, '=> rows', page.length);
	res.json(page);
});

app.listen(process.env.PORT || 3000, () => console.log('mock api up'));