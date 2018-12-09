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

export function getData({exchange, to, from, resolution}) {
	console.log(exchange, to, from, resolution)
	const promiseIntraDayContinuous = 
		fetch(`${BASE_URL}/${"histominute"}?e=${exchange}&fsym=${from}&tsym=${to}&aggregate=${resolution}`)
		.then(response => response.json())
		.then(({Data: data}) => {
			console.log({data})
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
		})
		.then(data => {
			data.sort((a, b) => {
				return a.date.valueOf() - b.date.valueOf();
			});
			return data;
		});
	return promiseIntraDayContinuous;
}

