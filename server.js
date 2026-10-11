const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const PAGE_SIZE = Number(process.env.PAGE_SIZE || 3);

// ---- Bảng giá: mã phải có trong B20Item.Code, nếu không INNER JOIN không ghi được dòng nào
const PRICE_CODES = ['VNM','FPT','HPG','VCB','MWG','SSI','VIC','MSN','GAS','ACB'];
const PRICE_ITEMS = PRICE_CODES.map((c, i) => ({ Id: i + 1, ItemCode: c, Par_Val: 10000 }));

// ---- Danh mục chứng khoán. Mã nên là mã CHƯA có trong B20Item thì Core mới thêm mới
// TradePlace và SectypeCd: đổi cho trùng giá trị đang có trong B20MapCore (mặc định là phỏng đoán)
const SECURITIES = [
	['VNM','Cty CP Sữa Việt Nam','001','001'], ['FPT','Cty CP FPT','001','001'],
	['HPG','Cty CP Tập đoàn Hòa Phát','001','001'], ['VCB','Ngân hàng TMCP Ngoại thương Việt Nam','001','001'],
	['MWG','Cty CP Đầu tư Thế giới Di động','001','001'], ['SSI','Cty CP Chứng khoán SSI','001','001'],
	['VIC','Tập đoàn Vingroup','001','001'], ['MSN','Tập đoàn Masan','001','001'],
	['GAS','Tổng Cty Khí Việt Nam','001','001'], ['ACB','Ngân hàng TMCP Á Châu','001','001'],
	['TCB','Ngân hàng TMCP Kỹ Thương Việt Nam','001','001'], ['VPB','Ngân hàng TMCP Việt Nam Thịnh Vượng','001','001'],
	['MBB','Ngân hàng TMCP Quân Đội','001','001'], ['STB','Ngân hàng TMCP Sài Gòn Thương Tín','001','001'],
	['PVD','Cty CP Khoan và Dịch vụ Khoan Dầu khí','001','001'], ['SHS','Cty CP Chứng khoán Sài Gòn - Hà Nội','002','001'],
	['PVS','Tổng Cty CP Dịch vụ Kỹ thuật Dầu khí','002','001'], ['CEO','Cty CP Tập đoàn C.E.O','002','001'],
	['BSR','Cty CP Lọc hóa dầu Bình Sơn','005','001'], ['ACV','Tổng Cty Cảng hàng không Việt Nam','005','001'],
	['VGI','Tổng Cty Cổ phần Viettel Global','005','001'], ['E1VFVN30','Quỹ ETF VFMVN30','001','003'],
	['TD2332001','Trái phiếu doanh nghiệp TD2332001','001','004']
].map((r, i) => ({
	Id: i + 1, ItemCode: r[0], ItemName: r[1], Unit: r[3] === '001' ? 'CP' : (r[3] === '003' ? 'CCQ' : 'TP'),
	SectypeCd: r[3], Par_Val: 10000, TradePlace: r[2]
}));

// ---- Nhà đầu tư (sinh tự động 25 dòng)
const CUSTOMERS = Array.from({ length: 25 }, (_, i) => ({
	Id: i + 1,
	CustomerCode: '036C' + String(100001 + i),
	Name: 'Nhà đầu tư thử nghiệm ' + (i + 1),
	CustomerType: i % 5 === 0 ? '2' : '1',
	CustomerCountry: 'C',
	Address: 'Số ' + (i + 1) + ' phố Test, Hà Nội',
	Tel: i % 7 === 0 ? null : '09' + String(10000000 + i * 137).slice(0, 8),
	Birthday: '1980-01-' + String((i % 28) + 1).padStart(2, '0') + 'T00:00:00',
	IdCardNo: '0010' + String(80000000 + i),
	IdCardDate: '2016-05-' + String((i % 28) + 1).padStart(2, '0') + 'T00:00:00',
	IdCardPlace: 'Hà Nội'
}));

function page(list, body) {
	const lastId = Number((body && body.Id) || 0);
	return list.filter(i => i.Id > lastId).slice(0, PAGE_SIZE).map(i => ({ IdMax: list.length, ...i }));
}

function auth(req, res) {
	if (req.headers.authorization !== 'Bearer mock-token-123') {
		res.status(401).json({ error: 'unauthorized' });
		return false;
	}
	return true;
}

app.post('/token', (req, res) => {
	const { username, password, grant_type } = req.body;
	if (username !== 'test' || password !== 'test123' || grant_type !== 'password')
		return res.status(400).json({ error: 'invalid_username_or_password' });
	res.json({ access_token: 'mock-token-123', token_type: 'bearer', expires_in: 3600 });
});

function dataRoute(path, list) {
	app.post(path, (req, res) => {
		if (!auth(req, res)) return;
		const rows = page(list, req.body);
		console.log(path, 'DocDate', req.body.DocDate, 'Id', req.body.Id, '=> rows', rows.length);
		res.json(rows);
	});
}

dataRoute('/price', PRICE_ITEMS);
dataRoute('/item', SECURITIES);
dataRoute('/cus', CUSTOMERS);

app.get('/', (req, res) => res.send('mock api up: POST /token, /price, /item, /cus'));

app.listen(process.env.PORT || 3000, () => console.log('mock api up'));
