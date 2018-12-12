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
			// const {to = "USD", from = "BTC", exchange = "Coinbase", resolution = 1} = this.props//.opts
			// // dispatch getCandleData
			// // getData({exchange, to, from, resolution}).then(data => {
			// // 	this.setState({ data })
			// // })//.catch(err => console.error(err))
			// // dispatch subRealtime
			// const socket_url = 'wss://streamer.cryptocompare.com'
			// const socket = io(socket_url)

			// const base = `${exchange}~${from}~${to}`
			// const currentPriceSub = `2~${base}`
			// const tradeSub = `0~${base}`

			// socket.emit('SubAdd', {subs: [currentPriceSub, tradeSub]})
			// // socket.emit('SubAdd', {subs: [currentPriceSub]})

			// socket.on('connect', () => {
			// 	console.log('socket connected')
			// })
			// socket.on('disconnect', () => {
			// 	console.log('socket disconnected')
			// })
			// socket.on('error', err  => {
			// 	console.log('socket error:', err)
			// })

			// socket.on('m', this.handleSocketEvent)
		
		}
		getLastBar = () => this.props.data[this.props.data.length - 1]
		
		handleSocketEvent = e => {
			function parseCCSocketData(raw) {
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
			const update = parseCCSocketData(e)
			//dispatch({type: "SOCKET_PRICE_UPDATE", payload: update})
			// everything below which mutates state needs to happen in a reducer
			if (this.props.data.length > 0 && update && update.PRICE) {
				// update the data?
				// console.log(`type: ${update.T || update.TYPE} ${update.PRICE || update.P}`)
				const data = this.state.data.slice(0)
				// console.log(update)
				const lastBar = this.getLastBar()
				// console.log(lastBar)
				let resolution = this.props.resolution || 1

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
					//dispatch({type: "SOCKET_PRICE_UPDATE", payload: update})
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
			} else if (update && update.T === 0) {
				console.log('Other update:',update)
			}
		}
		componentWillUnmount() {
			//cleanup our listener
		}
		
		render() {
			if (this.props.data.length < 1) {
				return <div style={{color: "#f9f9f9"}}>Loading...</div>
			}
			return <WrappedComponent {...this.props}   />
		}
	}

}
