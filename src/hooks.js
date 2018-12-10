import { useReducer } from 'react'

export function useCandleReducer(infoString, initialState = {}) {
		// const [state, setState] = useState({ [infoString]: initialState})
		const initialCandleState = {loading: false, canLoadMore: true, candleData: {}, allTs: []}
		initialState = {
			...initialState,
			[infoString]: initialCandleState
		}
		// console.log({initialState})
		const candleReducer = function(state, action) {
					// debugger
			const { payload } = action
			const { candleData } = state
			console.log({state})
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
				default:
					return state
			}
		}
		const [state, dispatch] = useReducer(rootReducer, initialState)
		// dispatch({type: "REQUEST_CANDLES", id: infoString})
		const {loading, candleData, canLoadMore, allTs} = state[infoString]
		console.log('STATE.INFOSTRING',state[infoString])
		console.log('inside custom hook', {candleData})
		return [{loading, candleData, canLoadMore, allTs}, dispatch]
	}
