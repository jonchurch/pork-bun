// import { tsvParse, csvParse } from  "d3-dsv";
// import { timeParse } from "d3-time-format";

// function parseData(parse) {
// 	return function(d) {
// 		d.date = parse(d.date);
// 		d.open = +d.open;
// 		d.high = +d.high;
// 		d.low = +d.low;
// 		d.close = +d.close;
// 		d.volume = +d.volume;

// 		return d;
// 	};
// }

// const parseDateTime = timeParse("%Y-%m-%d %H:%M:%S");

const BASE_URL = "https://min-api.cryptocompare.com/data"

function parseCCData({Data: data}) {
	console.log({data})
	if (!data.length) {
		return []
	}
	const parsed = data.map(datum => {
		// console.log({datum})
		return {
			date: new Date(datum.time * 1000),
			high: datum.high,
			low: datum.low,
			open: datum.open,
			close: datum.close,
			volume: datum.volumefrom
		}
	})
	return parsed
}

export function getData({exchange, to, from, resolution, start}) {
	// console.log(exchange, to, from, resolution, start)
	if (resolution.includes("D")) {
		// resolution = resolution === "2D" ? 172800 : 86400
		resolution = "histoday"
	} else {
		resolution = resolution >= 60 ? "histohour" : "histominute"
	}
		return fetch(`${BASE_URL}/${resolution}?e=${exchange}&fsym=${from}&tsym=${to}&limit=${resolution === "histoday" ? 500 : 2000}${start ? "&toTs=" + start : ''}`)//&aggregate=${resolution}`)
		.then(response => response.json())
		.then(res => {
			console.log({res})
			if (! res.Data.length) {
				console.error(new Error(res.Message))
				// return 
			}
			return res
		})
		.then(parseCCData)
		.then(data => {
			console.log('got data from api:', {data})
			data.sort((a, b) => {
				return a.date.valueOf() - b.date.valueOf();
			});
			return data;
		})
		// .catch(err => {throw err})
}


