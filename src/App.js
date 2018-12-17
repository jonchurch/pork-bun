import React, { useState, useReducer, useMemo, useEffect } from 'react';

import './App.css';
import CandleStickChart from './components/CandleStickChart'

import { getData } from './utils'
import { useCandleReducer, useCandleSelector, reduceResolution, useRealtimeData} from './hooks'

const resolutionOptions = [1, 5, 15, 30, 45, 60, 120, 240, 'D', '2D']
const symbolOptions = [
	"Coinbase:BTC/USD",
	"Coinbase:ETH/USD",
	"Binance:TRX/BTC",
	"Coinbase:BCH/USD",
	"Cryptopia:LTC/BTC",
	"Cryptopia:LUX/BTC",
	"Cryptopia:LPC*/BTC",
	"Cryptopia:SMART/BTC",
]

function parseSymbol(infoString) {
		const [exchange, pair]= infoString.split(':')
		const [from, to] = pair.split("/")
		return [exchange, from, to]
}

function App() {
	const [exchange, setExchange] = useState("Coinbase")
	const [from, setFrom] = useState("BTC")
	const [to, setTo] = useState("USD")
	const [resolution, setResolution] = useState("D")
	console.log('resolution top of app:',resolution)
	const infoString = `${exchange}:${from}/${to}@${resolution}`
	console.log({infoString})
	const [infoBase]= infoString.split("@")
	const baseResolution = reduceResolution(resolution)
	console.log('top of app',{baseResolution})
	const baseInfoString = `${infoBase}@${baseResolution}`
	const [{loading, candleData, canLoadMore, allTs}, dispatch] = useCandleReducer(baseInfoString)

	useRealtimeData({exchange, to, from}, dispatch)


	console.log({baseInfoString})

	const chartData = useCandleSelector(allTs, candleData, resolution)
	const lastPrice = chartData.length ? chartData[chartData.length - 1].close : ''
	useEffect(() => {
		document.title = `${from}/${to}: ${lastPrice} `
	}, [lastPrice, from, to])

	const symbolChange = e => {
		console.log(e.target.value)
		// parse this into exchange/from/to@rez?
		const [exchange, from, to] = parseSymbol(e.target.value)
		setExchange(exchange)
		setFrom(from)
		setTo(to)
	}

	const onSelectChange = e => setResolution(e.target.value)

	const onLoadMore = async (start, end) => {
		if (loading || !canLoadMore) {
			return 
		}
		console.log('loadmore',{start, end})
		dispatch({type: 'REQUEST_CANDLES', id: baseInfoString})
		const lastBarTs = allTs[0] - (allTs[1] - allTs[0]) 
		console.log({lastBarTs})
		const payload = await getData({exchange, to, from, resolution, start: lastBarTs})
		dispatch({type: "RECEIVE_CANDLES", id: baseInfoString, payload})

	}
	const loadChartData = async () => {
		dispatch({type: 'REQUEST_CANDLES', id: baseInfoString})
		const payload = await getData({exchange, to, from, resolution})
		dispatch({type: "RECEIVE_CANDLES", id: baseInfoString, payload})
		
	}
	if (loading === false && allTs.length < 1) {
		console.log({candleData})
		loadChartData()
	}
	console.log({candleData})
	console.log({allTs})

	// const chartData = selectChartData(resolution)
    return (
      <div className="App">
		<span>
			<h2 className="title-pair">
			{ infoString }
			</h2>
		<select
			className="pair-selector"
			name="pair"
			value={`${exchange}:${from}/${to}`}
			onChange={symbolChange}
		>
			{
			symbolOptions.map(
				e => <option key={e} value={e} >{e}</option>)
			}
		</select>
		<select
			className="resolution-selector"
			name="resolution"
			value={resolution}
			onChange={onSelectChange}
		>
			{
			resolutionOptions.map(
				e => <option key={e} value={e} >{e}</option>)
			}
		</select>
		</span>
		<CandleStickChart
			type="hybrid"
			height={675}
			// width={1200}
			exchange={exchange}
			from={from}
			to={to}
			resolution={resolution}
			data={chartData} // should candles be transformed inside or outside chart? prolly reducer side? Selector?
			onLoadMore={onLoadMore}
		/>
      </div>
    );
  }

export default App;
