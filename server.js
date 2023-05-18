const express = require('express');
const app = express();
const hbs = require('hbs');
const path = require('path');
const bodyParser = require('body-parser');
const axios = require('axios');
const https = require('https');

const PORT = 2000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.resolve(__dirname, 'public')))

app.set('view engine', 'hbs');
app.set('views', path.resolve(__dirname, 'views'));

app.get('/', (req, res) => {
	res.render('homepage');
})

app.post('/run-curl', (req, response) => {
	const str = req.body.data;

	const endponitPattern = `(https?:\/\/[A-z-0-9.\/\?=\&%]*)`
	const endpoint = str.match(endponitPattern)
								 ? str.match(endponitPattern)[0]
								 : null;
	console.log('ENDPOINT: ', endpoint, '\n');

	if (!endpoint) return response.send({
		error: {
			error: "Invalid endpoint found: " + endpoint
		}
	})

	let headers = str.match(/(?<=-H ')([^:]*)(: )([^']*)/g)
	if (headers) {
		headers = headers.map(header => {
			return header.split(/: /);
		})
	}
	console.log('HEADERS: ', headers, '\n')

	const cookieHeader = headers.find(e => e[0].match(/cookie/gi))
	// const allCookiesStr = cookieHeader.match(/(?<=Cookie: ).*/g)[0];
	// const cookies = allCookiesStr.split(/;\s+/).map(cookie => {
	const cookies = cookieHeader[1].split(/;\s+/).map(cookie => {
		const [input, key, eq, val] = cookie.match(/(\w+)(={1})(.*)/);
		return [key, val]
	})
	console.log('COOKIES: ', cookies, '\n')

	let data = str.match(/(?<=--data-raw \$?\s?')([^']*)/g)
						 ? str.match(/(?<=--data-raw \$?\s?')([^']*)/g)[0]
						 : null;
	console.log('------data:', data)
	if (data) {	
		console.log(data.match(/\\+n/g))
		data = data.replace(/\\+n/g, '');
		console.log('new data:', data)
	}
	const options = {
		headers: {},
		httpsAgent: new https.Agent({  
		  rejectUnauthorized: false
		})
	}
	headers.forEach(arr => {
		options['headers'][arr[0]] = arr[1]
	});
	console.log(options);

	axios.post(endpoint, data, options)
			.then(result => {
				console.log('--------------------RES')
				console.log(result.data);
				response.send({
					requestParams: {
						endpoint,
						headers,
						cookies,
						data
					},
					resultReceived: result.data
				})
			}).catch(err => {
				console.log('--------------------ERR')
				console.log(err);
				response.send({
					requestParams: {
						endpoint,
						headers,
						cookies,
						data
					},
					error: err?.response?.data ?? err
				})
			})
})

app.listen(PORT, () => {
	console.log(`Listening on port ${PORT}`);
})

const str = `curl 'http://analytics-fiq-dc0c5280-c73d-4ab0.fiq-dev.com/api/console/proxy?path=_search&method=GET' \
  -H 'Connection: keep-alive' \
  -H 'Pragma: no-cache' \
  -H 'Cache-Control: no-cache' \
  -H 'Accept: text/plain, */*; q=0.01' \
  -H 'kbn-xsrf: kibana' \
  -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36' \
  -H 'Content-Type: application/json' \
  -H 'Sec-GPC: 1' \
  -H 'Origin: http://analytics-fiq-dc0c5280-c73d-4ab0.fiq-dev.com' \
  -H 'Referer: http://analytics-fiq-dc0c5280-c73d-4ab0.fiq-dev.com/app/dev_tools' \
  -H 'Accept-Language: en-GB,en-US;q=0.9,en;q=0.8' \
  -H 'Cookie: amp_adc4c4=CjuiF3QUOJgb0I8TI0tgZN.RUo1S0xadDNobk94U0FnMHh0UjlDdVloUW1kMg==..1gpfepuqq.1gpfepuqq.0.8.8; security_authentication=Fe26.2**a80c02201ab544a170234c92324f164ef830984c0723aa9b1ac88772a5a1875f*oYNbAkfvAJbZsqGHvzUs2A*PJCm5yEfX5fkwNpoxDIekJN_a6FTcJo4g9RlWab3BzzWMSqrgcSxY-eVbN2PeYTrOlf5tIlnRAywtyQRla6H-XQxXwHVMLL1SF0q8yFGFULT0V2LN4oxPWBKMRc2awzbjgUcL5CECEEJKXV0drt8C-60PUli93Zh4kabdJTHSIH9hd2mBXZab1hge0q4Cy6hu-tjPYVZhbNtUZbNWNLN3Q**ac0d803e489640043e194de8b08b75184380511ed0945f5e16c44c15a0c023f7*X0OUdtUnWXkZBZC_1XrvFx4bJIwOam1glnM3gT49kco' \
  --data-raw $'{\n  "query": {\n    "match_all": {}\n  }\n}\n' \
  --compressed \
  --insecure`


console.log(str.match(/(?<=--data-raw \$?\s?')([^']*)/g))