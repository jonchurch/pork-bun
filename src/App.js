import React, { Component, useState, useReducer, useMemo } from 'react';

import './App.css';
import CandleStickChart from './components/CandleStickChart'

import { getData } from './utils'
import { useCandleReducer, useCandleSelector, reduceResolution } from './hooks'

const resolutionOptions = [1, 2, 5, 15, 30, 45, 60, 120, 'D']

function App() {
	const [exchange, setExchange] = useState("Coinbase")
	const [from, setFrom] = useState("BTC")
	const [to, setTo] = useState("USD")
	const [resolution, setResolution] = useState("120")

	const infoString = `${exchange}:${from}/${to}@${resolution}`
	const [infoBase]= infoString.split("@")
	const baseResolution = reduceResolution(resolution)
	const baseInfoString = `${infoBase}@${baseResolution}`
	const [{loading, candleData, canLoadMore, allTs}, dispatch] = useCandleReducer(baseInfoString)

	console.log({baseInfoString})

	const chartData = useCandleSelector(allTs, candleData, resolution)

	const onSelectChange = e => setResolution(e.target.value)
	const onLoadMore = async (start, end) => {
		if (loading || !canLoadMore) {
			return 
		}
		dispatch({type: 'REQUEST_CANDLES', id: baseInfoString})
		const lastBarTs = allTs[0]
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
