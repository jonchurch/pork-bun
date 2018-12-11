import { useReducer, useMemo } from 'react'
import groupBy from 'lodash.groupby'

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
		const { candleData } = state
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
