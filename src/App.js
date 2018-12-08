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

		socket.on('m', e => {
			const update = parseData(e)
			
			if (update && update.PRICE) {
				console.log(`type: ${update.T || update.TYPE} ${update.PRICE || update.P}`)
				const data = this.state.data.slice(0)
				console.log(update)
				data[data.length - 1].close = update.PRICE
				this.setState({ data })
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
