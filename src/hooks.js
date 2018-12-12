import { useReducer, useMemo, useEffect } from 'react'
import groupBy from 'lodash.groupby'
import io from 'socket.io-client'

import ccHelper from './CCMapHelper'

const socket_url = 'wss://streamer.cryptocompare.com'
const socket = io(socket_url)
socket.on('connect', () => {
	console.log('=====socket connected')
})
socket.on('disconnect', () => {
	console.log('=====socket disconnected')
})
socket.on('error', err  => {
	console.error('=====socket error:', err)
})

function parseCCSocketData(raw) {
	const { TRADE, CURRENT } = ccHelper.STATIC.TYPE
	const id = raw.split("~").shift()
	switch (id) {
		case TRADE:
			// let { P: price, LASTVOLUME: volume, LASTUPDATE: ts } = ccHelper.TRADE.unpack(raw)
			const trade = ccHelper.TRADE.unpack(raw)
			return { price: trade.P, volume: trade.Q, ts: trade.TS}
		case CURRENT:
			const { PRICE: price, LASTVOLUME: volume, LASTUPDATE: ts } = ccHelper.CURRENT.unpack(raw)
			return { ts, price, volume }
			// return null
		default:
			return null
	}
}
export function useRealtimeData({exchange, to, from}, dispatch) {
	useEffect(() => {
		const base = `${exchange}~${from}~${to}`
		const currentPriceSub = `2~${base}`
		const tradeSub = `0~${base}`
		const subs = [
			currentPriceSub,
			// tradeSub
		]

		socket.emit('SubAdd', {subs})

		socket.on('m', handleSocketEvent)
		let lastTrade = Date.now()
		let lastPrice = Date.now()
		function handleSocketEvent(event) {
				const now = Date.now()
			const update = parseCCSocketData(event)
			// console.log({update})
			if (update === null) return
			const { price, volume } = update
			console.log({price, volume})
			if (price || volume) {
				// const diff = (now - lastTrade) / 1000
				lastTrade = now
				// console.log('trade update', update)
				// console.log(`Trade:${p} Last:${diff}`)
				dispatch({type: 'SOCKET_PRICE_UPDATE', payload: update, exchange, from, to})
			}
			// if (price) {
			// 	const diff = (now - lastPrice) / 1000
			// 	lastPrice = now
			// 	console.log(`Price:${price} Last: ${diff}`)
			// 	// dispatch({type: 'SOCKET_PRICE_UPDATE', payload: update, exchange, from, to})
			// }
		}

		return () => {
			socket.emit('SubRemove', {subs: [currentPriceSub, tradeSub]})
		}
	}, [exchange, to, from])
}

export function useCandleReducer(infoString, initialState = {}) {
	console.log('infostring in useCandleReducer',{infoString})
	const initialCandleState = {loading: false, canLoadMore: true, candleData: {}, allTs: []}
	initialState = {
		...initialState,
		[infoString]: initialCandleState
	}
	const candleReducer = function(state = initialCandleState, action) {
				// debugger
		const { payload } = action
		const { candleData, allTs } = state
		// console.log('IN CANDLE REDUCER:',{state})
		switch (action.type) {
			case "REQUEST_CANDLES":
				return {
					...state,
					loading: true
				}
			case "RECEIVE_CANDLES":
				if (payload.length < 1) {
					return {
						...state,
						loading: false,
						canLoadMore: false,
					}
				}
				const newData  = payload.reduce((a, b) => {a[b.date.getTime() / 1000] = b; return a}, {})
				console.log({newData})
				const allTs = payload.map(i => i.date.getTime() / 1000).concat(state.allTs)
				allTs.sort((a, b) => a - b)
				return {
					...state,
					loading: false,
					allTs,
					candleData: { ...candleData, ...newData },
				}
			case "SOCKET_PRICE_UPDATE":
				console.log('update payload', {payload})
				console.log('IN SOCKET UPDATE',{state})
				const { price, volume } = payload
				if (state.allTs && state.allTs.length > 0) {
					const lastTs = state.allTs.slice(0).pop()
					let  lastBar = {...candleData[lastTs]}
					if (price) {
						if (price < lastBar.low) {
							lastBar.low = price
						} else if (price > lastBar.high) {
							lastBar.high = price
						}
						lastBar.close = price
					}
					if (volume) {
						lastBar.volume += volume
					}
					console.log('New close:',lastBar.close)
					const newState = {
						...state,
						candleData: {...candleData, [lastTs]: lastBar }
					}
					return newState

				} else {
					return state
				}
			default:
				return state
		}
	}
	const rootReducer = function(state, action) {
		console.log({action})
		console.log("ROOT REDUCER", {state})
		switch (action.type) {
			case 'REQUEST_CANDLES':
			case 'RECEIVE_CANDLES':
				return {
					...state,
					[action.id]: candleReducer(state[action.id], action)
				}
			case "SOCKET_PRICE_UPDATE":
				// update all three resolutions with their own reducer?
				console.log('websocket action',action)
				const {exchange, from, to, payload} = action
				const infoString = `${exchange}:${from}/${to}`
				return {
					...state,
					[`${infoString}@1`]: candleReducer(state[infoString + "@1"], action),
					[`${infoString}@60`]: candleReducer(state[infoString + "@60"], action),
					[`${infoString}@D`]: candleReducer(state[infoString + "@D"], action),
					// ["Coinbase:BTC/USD@60"]: candleReducer(state[], action),
					// ["Coinbase:BTC/USD@D"]: candleReducer({}, action)
				}
			default:
				return state
		}
	}
	const [state, dispatch] = useReducer(rootReducer, initialState)
	// select base resolution state
	const [infoStringBase, resolution] = infoString.split("@")
	console.log('SPLIT INFO', infoString.split("@"))
	console.log("REZ IN REDUCER:", {resolution})
	const baseResolution = reduceResolution(resolution)
	const newInfoString = `${infoStringBase}@${baseResolution}`
	console.log({baseResolution})
	console.log({infoString})
	// const candleState = state[newInfoString] //|| initialCandleState
	// console.log({candleState})
	console.log('bottom of reducer',{state})
	// const {loading, candleData, canLoadMore, allTs} = state[infoString] || initialCandleState
	const {loading, candleData, canLoadMore, allTs} = state[newInfoString] || initialCandleState
	return [{loading, candleData, canLoadMore, allTs}, dispatch]
}

export const useCandleSelector = (allTs, candleData, resolution) => {
	return  useMemo(() => selectCandleData(allTs, candleData, resolution), [allTs, candleData, resolution])

	function selectCandleData(allTs, candleData, resolution) {
		let reduced = null
		const data = allTs.map(index => candleData[index])
		if (!(resolution === 1 || resolution === 60 || resolution === "D")) {
			console.log("in candle select transform",{resolution})

			if (resolution.includes("D")) {
				// equivalent minutes for 2 or 1 day
				resolution = resolution === "2D" ? 2880 : 1440 
				console.log('resolution after includes:', resolution)
			}
			const coeff = resolution * 60
			const floorDate = coeff => candle => {
					// console.log({candle})
					const date = candle.date.getTime() / 1000
					return Math.floor(date / coeff) * coeff
				}
			const grouped = groupBy(data.slice(0), floorDate(coeff))
			reduced = Object.keys(grouped).map(key => {
				// end product is ohlc object reduced from each array
				const group = grouped[key]
				const low = Math.min(...group.map(c => c.low))
				const high = Math.max(...group.map(c => c.high))
				const volume = group.reduce((a,b) => a + b.volume, 0)
				return {
					date: new Date(key * 1000),
					open: group[0].open,
					close: group[group.length - 1].close,
					high,
					low,
					volume
				}
			})
		// console.log({reduced})
		// console.log('Bucket length:',Object.keys(grouped).length)
		}
		return reduced || data
	}
}
	export function reduceResolution(rez) {
		// heres my NaN
		rez = isNaN(Number(rez)) ? rez : Number(rez)
		console.log('REZ IN reduceResolution:', rez)
		if (typeof rez === 'string' && rez.includes('D')) return "D"
		if (rez === 1) return 1
		if (1 < rez && rez < 60) return 1
		if (rez === 60) return 60 
		if (rez > 60) return 60

		return rez
	}
