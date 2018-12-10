import React, { Component } from 'react'
import io from 'socket.io-client'
import groupBy from 'lodash.groupby'

import { getData } from '../utils'
import ccHelper from '../CCMapHelper'

export default function withRealtimeData(WrappedComponent) {
	return class RealtimeDataContainer extends Component {
		constructor(props) {
			super(props)
			this.state = {
				data: [],
				loading: false,
				canLoadMore: true,
				// dataById: {},
				// allIds: [],
			}
		}
		componentDidMount() {
			const {to = "USD", from = "BTC", exchange = "Coinbase", resolution = 1} = this.props//.opts
			// dispatch getCandleData
			// getData({exchange, to, from, resolution}).then(data => {
			// 	this.setState({ data })
			// })//.catch(err => console.error(err))
			// dispatch subRealtime
			const socket_url = 'wss://streamer.cryptocompare.com'
			const socket = io(socket_url)

			const base = `${exchange}~${from}~${to}`
			const currentPriceSub = `2~${base}`
			const tradeSub = `0~${base}`

			socket.emit('SubAdd', {subs: [currentPriceSub, tradeSub]})
			// socket.emit('SubAdd', {subs: [currentPriceSub]})

			socket.on('connect', () => {
				console.log('socket connected')
			})
			socket.on('disconnect', () => {
				console.log('socket disconnected')
			})
			socket.on('error', err  => {
				console.log('socket error:', err)
			})

			socket.on('m', this.handleSocketEvent)
		
		}
		getLastBar = () => this.state.data.slice(0).pop()
		
		handleSocketEvent = e => {
			function parseData(raw) {
				const { TRADE, CURRENT } = ccHelper.STATIC.TYPE
				const id = raw.split("~").shift()
				switch (id) {
					case TRADE:
						return ccHelper.TRADE.unpack(raw)
					case CURRENT:
						return ccHelper.CURRENT.unpack(raw)
					default:
						return null
				}
			}
			const update = parseData(e)
			
			if (this.state.data.length > 0 && update && update.PRICE) {
				// console.log(`type: ${update.T || update.TYPE} ${update.PRICE || update.P}`)
				const data = this.state.data.slice(0)
				// console.log(update)
				const lastBar = this.getLastBar()
				// console.log(lastBar)
				let resolution = this.props.resolution || 1
				// console.log({resolution})
				// if (resolution.includes('D')) {
				// 	// 1 day in minutes === 1440
				// 	resolution = 1440
				// } else if (resolution.includes('W')) {
				// 	// 1 week in minutes === 10080
				// 	resolution = 10080
				// } 

				var coeff = resolution * 60
				// console.log({coeff})
				var rounded = Math.floor(update.LASTUPDATE / coeff) * coeff
				var lastBarSec = lastBar.date.getTime() / 1000
				// console.log({lastBarSec})
				var _lastBar
				if (rounded > lastBarSec) {
					// create a new candle
					_lastBar = {
						date: new Date(rounded * 1000),
						open: lastBar.close,
						high: lastBar.close,
						low: lastBar.close,
						close: update.PRICE,
						volume: update.LASTVOLUME
					}
					data.push(_lastBar)
					this.setState({data})
					console.log('new bar!')
					
				} else {
					// update lastBar candle!
					if (update.price < lastBar.low) {
						lastBar.low = update.PRICE
					} else if (update.price > lastBar.high) {
						lastBar.high = update.PRICE
					}
					lastBar.volume += update.LASTVOLUME
					lastBar.close = update.PRICE
					data[data.length - 1] = lastBar
					this.setState({data})
				}
				// data[data.length - 1].close = update.PRICE
				// this.setState({ data })
			} else if (update && update.T === 0) {
				console.log('Other update:',update)
			}
		}
		componentWillUnmount() {
			//cleanup our listener
		}
		// callback for loading more data into the chart, mutates state
		loadMore = (start, end) => {
			if (this.state.loading || !this.state.canLoadMore) {
				return
			}
			this.setState({loading: true})
			const {to = "USD", from = "BTC", exchange = "Coinbase", resolution = 1} = this.props//.opts
			const { data } = this.state
			// need to get a timestamp in seconds for CC
			const lastBar = data[0]
			const lastBarTs = lastBar.date.getTime() / 1000
			console.log({lastBarTs})
			return getData({exchange, to, from, resolution, start: lastBarTs})
				.then(newData => {
					console.log({newData})
					// my brain a'splode
					// A good way to remove duplicates, is to make sure we don't do API calls for dupe data!
					// I'm thrashing here tryna remove the duplicate candles..
					console.log('Coinbase, data length:',this.state.data.length)
					if (newData.length === 0) {
						this.setState({canLoadMore: false})
					}
					// const filtered = newData
						// .concat(this.state.data)
						// .filter((elem, pos, arr) => {
						// 	const found = arr.indexOf(elem) == pos
						// 	// console.log(`${arr.indexOf(elem)} == ${pos}:`,arr.indexOf(elem) == pos)
						// 	// console.log({found})
						// 	return found
						// })
					const byId= newData
						.concat(this.state.data)
						.reduce((a, b) =>  {
							const dateSec = b.date.getTime() / 1000
							a[dateSec] = b
							return a
						},{})
					const dataArray = Object.keys(byId).map(key => byId[key])
					// console.log({byId})
					// console.log('byId length:', Object.keys(byId).length)
					// console.log({lastBar})
					// const uniqueDates = [... new Set(filtered.map(candle => candle.date.getTime() / 1000))]
					// console.log({uniqueDates})
					// console.log(`${filtered[0].date.toString()} < ${lastBar.date.toString()}`,filtered[0].date  < lastBar.date)
					// console.log('filtered length:',filtered.length)
					// here is where state is actually being updated, and duplicates are getting in
					
					this.setState({data: dataArray, loading: false})
				})
		}
		
		render() {
			// I want to compress the 1 min bars to 5 mins bars, ala tv
			// I need to reduce the array of data to timebuckets based on the set resolution
			//
			console.log('rendering')
			if (this.props.data.length < 1) {
				console.log(this.props.data)
				return <div>Loading...</div>
			}
			// console.log('======= data state',this.state.data)


// 			const  data = this.props.data.slice(0)
// 			console.log({data})
// 			const { resolution } = this.props
// 			const coeff = resolution * 60
// 			const floorDate = coeff => candle => {
// 					console.log({candle})
// 					const date = candle.date.getTime() / 1000
// 					return Math.floor(date / coeff) * coeff
// 				}
// 			const grouped = groupBy(data.slice(0), floorDate(coeff))
// 			const reduced = Object.keys(grouped).map(key => {
// 				// end product is ohlc object reduced from each array
// 				const group = grouped[key]
// 				const low = Math.min(...group.map(c => c.low))
// 				const high = Math.max(...group.map(c => c.high))
// 				const volume = group.reduce((a,b) => a + b.volume, 0)
// 				return {
// 					date: new Date(key * 1000),
// 					open: group[0].open,
// 					close: group[group.length - 1].close,
// 					high,
// 					low,
// 					volume
// 				}
// 			})
// 			console.log({reduced})
// 			console.log('Bucket length:',Object.keys(grouped).length)

			// return <WrappedComponent data={reduced} onLoadMore={this.loadMore} {...this.props} />
			console.log('DATA PROPS IN WRAPPER',this.props.data)
			return <WrappedComponent data={this.props.data} onLoadMore={this.loadMore} {...this.props} />
		}
	}

}
