import React, { Component, useState, useReducer } from 'react';

import './App.css';
import CandleStickChart from './components/CandleStickChart'

import { getData } from './utils'
import { useCandleReducer } from './hooks'

function App() {
	const [exchange, setExchange] = useState("Coinbase")
	const [from, setFrom] = useState("BTC")
	const [to, setTo] = useState("USD")
	const [resolution, setResolution] = useState("120")

	const infoString = `${exchange}:${from}/${to}@${resolution}`

	// const initialCandleState = {loading: false, canLoadMore: true, candleData: {}}

	const [{loading, candleData, canLoadMore, allTs}, dispatch] = useCandleReducer(infoString)
	console.log({candleData})
	const resolutionOptions = [1, 2, 5, 15, 30, 45, 60, 120, 'D']

	// what exactly am I trying to get here? well I'm confused about where my state should live sorta
	// I'm just going to stick stuff in the top most level
	// How do I intend to use this reducer?
	// It returns the current state, I call dispatch to mutate the state
	// hmmm, I sketched out initial state which is really just for a branch of candle data
	// I want to cache the data, that's a big part of managing the state, but I'll need a reducer to manage ALL candles, and also the single candle record
	
	// function useCandleReducer(infoString, initialState = {}) {
	// 	// const [state, setState] = useState({ [infoString]: initialState})
	// 	const initialCandleState = {loading: false, canLoadMore: true, candleData: {}, allTs: []}
	// 	initialState = {
	// 		...initialState,
	// 		[infoString]: initialCandleState
	// 	}
	// 	// console.log({initialState})
	// 	const candleReducer = function(state, action) {
	// 		const { payload } = action
	// 		const { candleData } = state
	// 		console.log({state})
	// 		switch (action.type) {
	// 			case "REQUEST_CANDLES":
	// 				return {
	// 					...state,
	// 					loading: true
	// 				}
	// 			case "RECEIVE_CANDLES":
	// 				if (payload.length < 1) {
	// 					return {
	// 						...state,
	// 						loading: false,
	// 						canLoadMore: false,
	// 					}
	// 				}
	// 				// uhh now I gotta merge the old candles and the new
	// 				const newData  = payload.reduce((a, b) => {a[b.date.getTime() / 1000] = b; return a}, {})
	// 				console.log({newData})
	// 				const allTs = payload.concat(allTs.map(i => candleData[i].date.getTime() / 1000))
	// 				allTs.sort((a, b) => a - b)
	// 				return {
	// 					...state,
	// 					loading: false,
	// 					allTs,
	// 					candleDate: { ...candleData, ...newData },
	// 				}
	// 			default:
	// 				return state
	// 		}
	// 	}
	// 	const rootReducer = function(state, action) {
	// 		switch (action.type) {
	// 			case 'REQUEST_CANDLES':
	// 			case 'RECEIVE_CANDLES':
	// 				return {
	// 					...state,
	// 					[action.id]: candleReducer(state[action.id], action)
	// 				}
	// 			default:
	// 				return state
	// 		}
	// 	}
	// 	const [state, dispatch] = useReducer(rootReducer, initialState)
	// 	// dispatch({type: "REQUEST_CANDLES", id: infoString})
	// 	const {loading, candleData, canLoadMore, allTs} = state[infoString]
	// 	console.log('STATE.INFOSTRING',state[infoString])
	// 	console.log('inside custom hook', {candleData})
	// 	return [{loading, candleData, canLoadMore, allTs}, dispatch]
	// }

	const onSelectChange = e => setResolution(e.target.value)
	const onLoadMore = async (start, end) => {
		// need to check some state right hurr...
		if (loading || !canLoadMore) {
			return 
		}
		dispatch({type: 'REQUEST_CANDLES', id: infoString}) // tell state we are loading...
		// do async action 
		const lastBarTs = Math.min(allTs)//candleData.byId[candleData.allids[0]].date.getTime() / 1000
		const payload = await getData({exchange, to, from, resolution, start: lastBarTs})
		console.log({payload})
		dispatch({type: "RECEIVE_CANDLES", payload})

	}

	const loadChartData = () => {
		dispatch({type: 'REQUEST_CANDLES', id: infoString}) // tell state we are loading...
		// do async action 
		// const lastBarTs = Math.min(allTs)//candleData.byId[candleData.allids[0]].date.getTime() / 1000
		const payload = getData({exchange, to, from, resolution})
			.then(payload => dispatch({type: "RECEIVE_CANDLES", id: infoString, payload}))
		
	}
	if (loading === false && allTs.length < 1) {
		console.log({candleData})
		loadChartData()
	}
	console.log({candleData})
	console.log({allTs})
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
			data={allTs.map(index => candleData[index])} // should candles be transformed inside or outside chart? prolly reducer side? Selector?
			onLoadMore={onLoadMore}
		/>
      </div>
    );
  }

export default App;
