import { useReducer, useMemo } from 'react'
import groupBy from 'lodash.groupby'

export const useCandleSelector = (allTs, candleData, resolution) => {
	return  useMemo(() => selectCandleData(allTs, candleData, resolution), [allTs, candleData, resolution])

	function selectCandleData(allTs, candleData, resolution) {
		let reduced = null
		const data = allTs.map(index => candleData[index])
		if (!(resolution === 1 || resolution === 60)) {
			// const allTs = state[infoString].allTs
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
		console.log({reduced})
		console.log('Bucket length:',Object.keys(grouped).length)
		}
		return reduced || data
	}
}
export function useCandleReducer(infoString, initialState = {}) {
	// const [state, setState] = useState({ [infoString]: initialState})
	const initialCandleState = {loading: false, canLoadMore: true, candleData: {}, allTs: []}
	initialState = {
		...initialState,
		[infoString]: initialCandleState
	}
	const candleReducer = function(state = initialCandleState, action) {
				// debugger
		const { payload } = action
		const { candleData } = state
		console.log('IN CANDLE REDUCER:',{state})
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
	// useCandleSelector(allTs, candleData, resolution)//useMemo(() => selectCandleData(allTs, candleData, resolution), [allTs, candleData, resolution])
	// select base resolution state
	const [infoStringBase, resolution] = infoString.split("@")
	const baseResolution = reduceResolution(resolution)
	const newInfoString = `${infoStringBase}@${baseResolution}`
	const candleState = state[newInfoString] //|| initialCandleState

	const {loading, candleData, canLoadMore, allTs} = state[infoString] || initialCandleState
	return [{loading, candleData, canLoadMore, allTs}, dispatch]
}

	function reduceResolution(rez) {
		rez = typeof Number(rez) === 'number' ? Number(rez) : rez
		console.log('REZ IN REDUCEREZ:', rez)
		if (typeof rez === 'string' && rez.includes('D')) return "D"
		if (rez === 1) return 1
		if (1 < rez && rez < 60) return 1
		if (rez === 60) return 60 
		if (rez > 60) return 60

		return rez
	}
