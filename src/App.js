import React, { Component } from 'react';
import io from 'socket.io-client'

import './App.css';
import { getData } from './utils'
import ccHelper from './CCMapHelper'

import CandleStickChart from './components/CandleStickChart'

class App extends Component {
	componentDidMount() {
		getData().then(data => {
			this.setState({ data })
		})
		// setup websocket connection to CC
		// update dataset on new trades, and new intervals?
		// const updateInterval = setInterval(() => {
		// 	if (this.state && this.state.data) {
		// 		const data = this.state.data.slice(0)
		// 		data[data.length - 1].close += 1
		// 		this.setState({ data })
		// 	}
		// }, 3000)
		const socket_url = 'wss://streamer.cryptocompare.com'
		const socket = io(socket_url)

		socket.on('connect', () => {
			console.log('socket connected')
		})
		socket.on('disconnect', () => {
			console.log('socket disconnected')
		})
		socket.on('error', err  => {
			console.log('socket error:', err)
		})

		const getLastBar = () => {
			return this.state.data.slice(0).pop()
		}
		socket.on('m', e => {
			const update = parseData(e)
			
			if (this.state && update && update.PRICE) {
				console.log(`type: ${update.T || update.TYPE} ${update.PRICE || update.P}`)
				const data = this.state.data.slice(0)
				console.log(update)
				const lastBar = getLastBar()
				console.log(lastBar)
				let resolution = 1//= sub.resolution
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
					// create a new candle, use last close as open **PERSONAL CHOICE**
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
		})
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
		const currentPriceSub = "2~Coinbase~BTC~USD"
		const tradeSub = "0~Coinbase~BTC~USD"
		socket.emit('SubAdd', {subs: [currentPriceSub, tradeSub]})
		// socket.emit('SubAdd', {subs: [currentPriceSub]})
	}
  render() {
	  if (this.state == null) {
		  return <div>Loading...</div>
	  }
    return (
      <div className="App">
		<CandleStickChart 
			height={500}
			width={1440}
			data={this.state.data}
		/>
      </div>
    );
  }
}

export default App;
