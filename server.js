const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const PAGE_SIZE = Number(process.env.PAGE_SIZE || 3);
const TRANS_COUNT = Number(process.env.TRANS_COUNT || 80);

// ---- Bảng giá: mã phải có trong B20Item.Code, nếu không INNER JOIN không ghi được dòng nào
const PRICE_CODES = ['VNM','FPT','HPG','VCB','MWG','SSI','VIC','MSN','GAS','ACB'];
const PRICE_ITEMS = PRICE_CODES.map((c, i) => ({ Id: i + 1, ItemCode: c, Par_Val: 10000 }));

// ---- Danh mục chứng khoán. Mã nên là mã CHƯA có trong B20Item thì Core mới thêm mới
// Mỗi dòng: [ItemCode, ItemName, TradePlace, SectypeCd]
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
	['VGI','Tổng Cty Cổ phần Viettel Global','005','001'],

	// ---- 60 mã bổ sung
	['HDB','Ngân hàng TMCP Phát triển TP.HCM','001','001'], ['VIB','Ngân hàng TMCP Quốc tế Việt Nam','001','001'],
	['TPB','Ngân hàng TMCP Tiên Phong','001','001'], ['SHB','Ngân hàng TMCP Sài Gòn - Hà Nội','001','001'],
	['LPB','Ngân hàng TMCP Lộc Phát Việt Nam','001','001'], ['MSB','Ngân hàng TMCP Hàng Hải Việt Nam','001','001'],
	['OCB','Ngân hàng TMCP Phương Đông','001','001'], ['EIB','Ngân hàng TMCP Xuất Nhập khẩu Việt Nam','001','001'],
	['BID','Ngân hàng TMCP Đầu tư và Phát triển Việt Nam','001','001'], ['CTG','Ngân hàng TMCP Công Thương Việt Nam','001','001'],
	['VHM','Cty CP Vinhomes','001','001'], ['VRE','Cty CP Vincom Retail','001','001'],
	['NVL','Cty CP Tập đoàn Đầu tư Địa ốc No Va','001','001'], ['PDR','Cty CP Phát triển Bất động sản Phát Đạt','001','001'],
	['DXG','Cty CP Tập đoàn Đất Xanh','001','001'], ['KDH','Cty CP Đầu tư và Kinh doanh Nhà Khang Điền','001','001'],
	['DIG','Tổng Cty CP Đầu tư Phát triển Xây dựng','001','001'], ['CII','Cty CP Đầu tư Hạ tầng Kỹ thuật TP.HCM','001','001'],
	['HCM','Cty CP Chứng khoán TP.HCM','001','001'], ['VND','Cty CP Chứng khoán VNDIRECT','001','001'],
	['VCI','Cty CP Chứng khoán Vietcap','001','001'], ['FTS','Cty CP Chứng khoán FPT','001','001'],
	['BSI','Cty CP Chứng khoán BIDV','001','001'], ['CTS','Cty CP Chứng khoán Ngân hàng Công Thương Việt Nam','001','001'],
	['ORS','Cty CP Chứng khoán Tiên Phong','001','001'], ['AGR','Cty CP Chứng khoán Agribank','001','001'],
	['SAB','Tổng Cty CP Bia - Rượu - Nước giải khát Sài Gòn','001','001'], ['BVH','Tập đoàn Bảo Việt','001','001'],
	['PLX','Tập đoàn Xăng dầu Việt Nam','001','001'], ['POW','Tổng Cty Điện lực Dầu khí Việt Nam','001','001'],
	['PNJ','Cty CP Vàng bạc Đá quý Phú Nhuận','001','001'], ['REE','Cty CP Cơ điện lạnh','001','001'],
	['GMD','Cty CP Gemadept','001','001'], ['HAH','Cty CP Vận tải và Xếp dỡ Hải An','001','001'],
	['VJC','Cty CP Hàng không Vietjet','001','001'], ['HVN','Tổng Cty Hàng không Việt Nam','001','001'],
	['DGC','Cty CP Tập đoàn Hóa chất Đức Giang','001','001'], ['DPM','Tổng Cty Phân bón và Hóa chất Dầu khí','001','001'],
	['DCM','Cty CP Phân bón Dầu khí Cà Mau','001','001'], ['GVR','Tập đoàn Công nghiệp Cao su Việt Nam','001','001'],
	['SSB','Ngân hàng TMCP Đông Nam Á','005','001'], ['STK','Cty CP Sợi Thế Kỷ','001','001'],
	['TNG','Cty CP Đầu tư và Thương mại TNG','002','001'], ['MSH','Cty CP May Sông Hồng','001','001'],
	['VHC','Cty CP Vĩnh Hoàn','001','001'], ['ANV','Cty CP Nam Việt','001','001'],
	['IDI','Cty CP Đa Quốc Gia I.D.I','001','001'], ['FMC','Cty CP Thực phẩm Sao Ta','001','001'],
	['DBC','Cty CP Tập đoàn Dabaco Việt Nam','001','001'], ['HAG','Cty CP Hoàng Anh Gia Lai','001','001'],
	['HNG','Cty CP Nông nghiệp Quốc tế Hoàng Anh Gia Lai','001','001'], ['KBC','Tổng Cty Phát triển Đô thị Kinh Bắc','001','001'],
	['IDC','Tổng Cty IDICO','002','001'], ['SZC','Cty CP Sonadezi Châu Đức','001','001'],
	['NLG','Cty CP Đầu tư Nam Long','001','001'], ['VCG','Tổng Cty Cổ phần Xuất nhập khẩu và Xây dựng Việt Nam','001','001'],
	['HHV','Cty CP Đầu tư Hạ tầng Giao thông Đèo Cả','001','001'], ['PC1','Cty CP Tập đoàn PC1','001','001'],
	['GEG','Cty CP Điện Gia Lai','001','001'], ['BWE','Cty CP Nước - Môi trường Bình Dương','001','001'],

	['E1VFVN30','Quỹ ETF VFMVN30','001','003'],
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

// ---- Loại giao dịch: [TransType, Description]
const TRANS_TYPES = [
	['GDTD022','Hoàn nhập dự phòng chứng khoán tự doanh'],
	['GDTD021','Dự phòng chứng khoán tự doanh'],
	['GDTD020','CK phát hành thêm về tài khoản'],
	['GDTD019','CK phát hành thêm về tài khoản'],
	['GDTD018','Đăng ký mua phát hành ck tự doanh'],
	['GDTD017','Nhận cổ tức bằng cổ phiếu của Tự doanh'],
	['GDTD016','Nhận cổ tức bằng tiền của Tự doanh'],
	['GDTD015','Thanh toán bù trừ tự doanh ngày T-2'],
	['GDTD014','Thanh toán bù trừ tự doanh ngày T-2'],
	['GDTD013','Hạch toán TTBT bán ck ngày T-2'],
	['GDTD012','Hạch toán TTBT mua ck ngày T-2'],
	['GDTD011','Xuất ck chờ giao dịch bán ngày T-2'],
	['GDTD010','Xuất ck chờ mua thanh toán ngày T-2'],
	['GDTD009','Nhập chứng khoán mua ngày T-2'],
	['GDTD008','Nhập chứng khoán mua ngày T-2'],
	['GDTD007','Xuất bán CK ngày T0'],
	['GDTD006','CK bán chờ thanh toán ngày T0'],
	['GDTD005','Bán chứng khoán ngày T0'],
	['GDTD004','Bán chứng khoán ngày T0'],
	['GDTD003','Bán chứng khoán ngày T0'],
	['GDTD002','Mua chứng khoán ngày T0'],
	['GDTD001','Mua chứng khoán ngày T0'],
	['GDNDT059','Hợp đồng tiền gửi tái tục(gốc cũ)'],
	['GDNDT058','Hợp đồng tiền gửi tất toán/tất toán trước hạn'],
	['GDNDT057','Phí lưu ký phải thu của NĐT'],
	['GDNDT056','Công ty thu phí LK'],
	['GDNDT055','NĐT thanh toán phí LK'],
	['GDNDT054','NĐT thanh toán phí LK'],
	['GDNDT053','Phân bổ lãi KKH cho NĐT'],
	['GDNDT052','Phân bổ lãi KKH cho NĐT'],
	['GDNDT051','Phân bổ lãi KKH cho NĐT'],
	['GDNDT049','Phân bổ cố tức cho tự doanh'],
	['GDNDT048','Phân bổ cố tức cho NĐT'],
	['GDNDT047','Phân bổ cố tức cho NĐT'],
	['GDNDT042','NĐT trả  lãi ký quỹ'],
	['GDNDT041','Công ty thu lãi ký quỹ'],
	['GDNDT040','Công ty thu nợ vay ký quỹ'],
	['GDNDT039','Khách hàng thanh toán nợ vay ký quỹ  (NĐT  nước ngoài)'],
	['GDNDT038','Khách hàng thanh toán nợ vay ký quỹ  (NĐT trong nước)'],
	['GDNDT037','Khách hàng nhận nợ vay ký quỹ (NĐT  nước ngoài)'],
	['GDNDT036','Khách hàng nhận nợ vay ký quỹ (NĐT trong nước)'],
	['GDNDT035','Giải ngân cho vay ký quỹ'],
	['GDNDT034','Thu lãi ứng trước'],
	['GDNDT033','Công ty thu nợ tiền ứng trước'],
	['GDNDT032','Khách hàng nước ngoài hoàn trả tiền Ứng trước'],
	['GDNDT031','Khách hàng trong nước hoàn trả tiền Ứng trước'],
	['GDNDT030','Khách hàng nước ngoài nhận tiền Ứng trước'],
	['GDNDT029','Khách hàng trong nước nhận tiền Ứng trước'],
	['GDNDT028','Giải Ngân Ứng trước tiền bán chứng khoán'],
	['GDNDT027','Thanh toán bù trừ T-2 NDT nước ngoài'],
	['GDNDT026','Thanh toán bù trừ T-2 NDT trong nước'],
	['GDNDT025','Thanh toán bù trừ T-2 NDT nước ngoài'],
	['GDNDT024','Thanh toán bù trừ T-2 NDT trong nước'],
	['GDNDT023','Thuế bán T-2 NDT trong nước, nước ngoài'],
	['GDNDT022','Thuế bán T-2 NDT  nước ngoài'],
	['GDNDT021','Thuế bán T-2 NDT trong nước'],
	['GDNDT020','Thu phí bán chứng khoán ngày T-2'],
	['GDNDT019','Phí bán T-2 NDT  nước ngoài'],
	['GDNDT018','Phí bán T-2 NDT trong nước'],
	['GDNDT017','Tiền bán CK ngày T-2 NDT  nước ngoài'],
	['GDNDT016','Tiền bán CK ngày T-2 NDT trong nước'],
	['GDNDT015','Tiền mua CK ngày T-2 NDT  nước ngoài'],
	['GDNDT014','Tiền mua CK ngày T-2 NĐT trong nước'],
	['GDNDT013','Phí bán T0 NDT (cả trong nước và nước ngoài)'],
	['GDNDT012','Phí mua T0 NDT  nước ngoài'],
	['GDNDT011','Phí mua T0 NDT trong nước'],
	['GDNDT010','Phí mua T0 NDT  nước ngoài'],
	['GDNDT009','Phí mua T0 NDT trong nước'],
	['GDNDT008','Tiền mua chứng khoán ngày T0 NĐT nước ngoài'],
	['GDNDT007','Tiền mua chứng khoán ngày T0 NĐT trong nước'],
	['GDNDT006','Công ty cắt  tiền mua TP theo yêu cầu của KH'],
	['GDNDT005','Công ty cắt  tiền mua TP theo yêu cầu của KH'],
	['GDNDT004','Rút tiền tài khoản NDT  nước ngoài'],
	['GDNDT003','Rút tiền tài khoản NĐT trong nước ngân hàng VP Bank'],
	['GDNDT002','Nộp tiền vào tài khoản NĐT nước ngoài'],
	['GDNDT001','Nộp tiền vào tài khoản NĐT trong nước ngân hàng VP Bank']
];

// Giao dịch liên quan chứng khoán thì có StockCode và Quantity
const STOCK_RE = /chứng khoán|CK|cổ tức|cổ phiếu|TP\b|trái phiếu|phát hành/i;

// Sinh danh sách giao dịch cho 1 ngày/chi nhánh (cố định theo DocDate nên chạy lại vẫn ra cùng dữ liệu)
function buildTrans(docDate, branchId) {
	const day = (docDate || new Date().toISOString().slice(0, 10)).slice(0, 10);
	return Array.from({ length: TRANS_COUNT }, (_, i) => {
		const t = TRANS_TYPES[(i * 7) % TRANS_TYPES.length];
		const cus = CUSTOMERS[i % CUSTOMERS.length];
		const isStock = t[0].startsWith('GDTD') || STOCK_RE.test(t[1]);
		const sec = SECURITIES[(i * 5) % SECURITIES.length];
		const qty = isStock ? (((i % 9) + 1) * 100) : 0;
		return {
			Id: i + 1,
			ReferenceNo: 'REF' + day.replace(/-/g, '') + String(i + 1).padStart(5, '0'),
			TransDate: day + 'T00:00:00',
			TransType: t[0],
			Description: t[1],
			InvestorCode: cus.CustomerCode,
			BranchID: branchId || 'A01',
			BranchProcess: branchId || 'A01',
			BankCd: i % 3 === 0 ? 'VPB' : (i % 3 === 1 ? 'VCB' : ''),
			StockCode: isStock ? sec.ItemCode : '',
			Quantity: qty,
			Amount: isStock ? qty * 10000 : ((i % 10) + 1) * 1000000,
			TransFloor: isStock ? sec.TradePlace : '',
			IsCoreBank: i % 2 === 0 ? 'Y' : 'N',
			CustomerType: cus.CustomerType,
			CustomerCountry: cus.CustomerCountry
		};
	});
}

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
		const rows = page(typeof list === 'function' ? list(req.body) : list, req.body);
		console.log(path, 'DocDate', req.body.DocDate, 'Id', req.body.Id, '=> rows', rows.length);
		res.json(rows);
	});
}

dataRoute('/price', PRICE_ITEMS);
dataRoute('/item', SECURITIES);
dataRoute('/cus', CUSTOMERS);
dataRoute('/trans', body => buildTrans(body.DocDate, body.BranchID));

app.get('/', (req, res) => res.send('mock api up: POST /token, /price, /item, /cus, /trans'));

app.listen(process.env.PORT || 3000, () => console.log('mock api up'));
