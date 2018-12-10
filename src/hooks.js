import { useReducer } from 'react'

export function useCandleReducer(infoString, initialState = {}) {
		// const [state, setState] = useState({ [infoString]: initialState})
		const initialCandleState = {loading: false, canLoadMore: true, candleData: {}, allTs: []}
		initialState = {
			...initialState,
			[infoString]: initialCandleState
		}
		// console.log({initialState})
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
					// uhh now I gotta merge the old candles and the new
					const newData  = payload.reduce((a, b) => {a[b.date.getTime() / 1000] = b; return a}, {})
					console.log({newData})
					// const allTs = payload.mapconcat(state.allTs.map(i => candleData[i].date.getTime() / 1000))
					const allTs = payload.map(i => i.date.getTime() / 1000).concat(state.allTs)
					console.log('INSIDE RECEIVE REDUCER',{allTs})
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
				// case 'SELECT_RESOLUTION':
				// 	return {
				// 		...state,
				// 		[action.id]: candleReducer(state[action.id], action)
				// 	}
				default:
					return state
			}
		}
		const [state, dispatch] = useReducer(rootReducer, initialState)

		console.log('IN ROOT CUSTOM HOOK:', {state})
		console.log({infoString})
		console.log('STATE.INFOSTRING',state[infoString])
		//giving it default state if state doesnt exist yet
		const {loading, candleData, canLoadMore, allTs} = state[infoString] || initialCandleState

		console.log('inside custom hook', {candleData})
		return [{loading, candleData, canLoadMore, allTs}, dispatch]
	}
