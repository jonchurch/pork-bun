import React, { Component } from 'react'
import io from 'socket.io-client'
import groupBy from 'lodash.groupby'

import { getData } from '../utils'
import ccHelper from '../CCMapHelper'

export default function withRealtimeData(WrappedComponent) {
	return class RealtimeDataContainer extends Component {
		// constructor(props) {
		// 	super(props)
		// 	this.state = {
		// 		data: []
		// 	}
		// }
		componentDidMount() {
			const {to = "USD", from = "BTC", exchange = "Coinbase", resolution = 1} = this.props//.opts
			console.log('WRAPPER PROPS',this.props)
			getData({exchange, to, from, resolution}).then(data => {
				this.setState({ data })
			})
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
			
			if (this.state && update && update.PRICE) {
				console.log(`type: ${update.T || update.TYPE} ${update.PRICE || update.P}`)
				const data = this.state.data.slice(0)
				console.log(update)
				const lastBar = this.getLastBar()
				console.log(lastBar)
				let resolution = this.props.resolution || 1
				console.log({resolution})
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
				console.log({lastBarSec})
				var _lastBar

				if (rounded > lastBarSec) {
					// create a new candle
					_lastBar = {
						date: new Date(rounded * 1000),
						open: lastBar.close,
						high: lastBar.close,
						low: lastBar.close,
						close: update.PRICE,
						volume: update.volume
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
					lastBar.volume += update.volume
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
		
		render() {
			// I want to compress the 1 min bars to 5 mins bars, ala tv
			// I need to reduce the array of data to timebuckets based on the set resolution
			//
			if (this.state == null) {
				return <div>Loading...</div>
			}
			const { data } = this.state
			const { resolution } = this.props
			const coeff = resolution * 60
			const floorDate = coeff => candle => {
					const date = candle.date.getTime() / 1000
					return Math.floor(date / coeff) * coeff
				}
			const grouped = groupBy(data.slice(0), floorDate(coeff))
			console.log('Bucket length:',Object.keys(grouped).length)

			// var rounded = Math.floor(update.LASTUPDATE / coeff) * coeff
			console.log(coeff)
			// const filteredData = this.state.data.map()
			return <WrappedComponent data={data} {...this.props} />
		}
	}

}
