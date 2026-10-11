const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const PAGE_SIZE = 3;

// ---------- Auth dùng chung ----------
function checkAuth(req, res) {
	if (req.headers.authorization !== 'Bearer mock-token-123') {
		res.status(401).json({ error: 'unauthorized' });
		return false;
	}
	return true;
}

// ---------- Bảng giá ----------
// Đổi thành mã thật có trong B20Item.Code, nếu không INNER JOIN sẽ không ghi được dòng nào
const CODES = ['VNM','FPT','HPG','VCB','MWG','SSI','VIC','MSN','GAS','ACB'];
const ITEMS = CODES.map((c, i) => ({ Id: i + 1, ItemCode: c, Par_Val: 10000 }));

// ---------- Nhà đầu tư ----------
// CustomerType: map theo B20MapCore (MAPCORE_CUS), mã 1 = cá nhân, 2 = tổ chức (tùy cấu hình của bạn)
// Mã 036C0xxxxx không trùng B20Customer.Code thì mới được thêm mới
const INVESTOR_TOTAL = 10;
const INVESTORS = Array.from({ length: INVESTOR_TOTAL }, (_, i) => {
	const n = i + 1;
	const isOrg = n % 5 === 0;
	return {
		Id: n,
		CustomerCode: '036C' + String(900000 + n).padStart(6, '0'),
		Name: (isOrg ? 'Công ty TNHH Mẫu ' : 'Nguyễn Văn Mẫu ') + n,
		CustomerType: isOrg ? '2' : '1',
		CustomerCountry: 'C',
		Address: n + ' Phố Test, Hoàn Kiếm, Hà Nội',
		Tel: n % 4 === 0 ? null : '09000000' + String(n).padStart(2, '0'),
		Birthday: isOrg ? null : '1980-01-' + String((n % 28) + 1).padStart(2, '0') + 'T00:00:00',
		IdCardNo: isOrg ? null : '0010800' + String(10000 + n),
		IdCardDate: isOrg ? null : '2015-05-' + String((n % 28) + 1).padStart(2, '0') + 'T00:00:00',
		IdCardPlace: isOrg ? null : 'Hà Nội'
	};
});

// ---------- Token ----------
app.post('/token', (req, res) => {
	const { username, password, grant_type } = req.body;
	if (username !== 'test' || password !== 'test123' || grant_type !== 'password')
		return res.status(400).json({ error: 'invalid_username_or_password' });
	res.json({ access_token: 'mock-token-123', token_type: 'bearer', expires_in: 3600 });
});

// ---------- Bảng giá: body {"DocDate":"...","Id":0} ----------
app.post('/price', (req, res) => {
	if (!checkAuth(req, res)) return;
	const lastId = Number(req.body.Id || 0);
	const page = ITEMS.filter(i => i.Id > lastId).slice(0, PAGE_SIZE)
		.map(i => ({ IdMax: ITEMS.length, ...i }));
	console.log('[price] DocDate', req.body.DocDate, 'Id', lastId, '=> rows', page.length);
	res.json(page);
});

// ---------- Nhà đầu tư: body {"Id":0} ----------
app.post('/investor', (req, res) => {
	if (!checkAuth(req, res)) return;
	const lastId = Number(req.body.Id || 0);
	const page = INVESTORS.filter(i => i.Id > lastId).slice(0, PAGE_SIZE)
		.map(i => ({ IdMax: INVESTORS.length, ...i }));
	console.log('[investor] Id', lastId, '=> rows', page.length);
	res.json(page);
});

app.listen(process.env.PORT || 3000, () => console.log('mock api up'));
