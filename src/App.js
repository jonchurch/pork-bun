import React, { Component } from 'react';

import './App.css';
import CandleStickChart from './components/CandleStickChart'

class App extends Component {
	constructor() {
	  super()
	  // setup some interface for changing the pair on the chart
	  this.state = {
		  exchange: "Coinbase",
		  from: "BTC",
		  to: "USD",
		  resolution: 2,
		  resolutionOptions: [1, 2, 5, 15, 30, 45, 60, 120, 'D']
	  }
	}

	onSelectChange = e => {
		this.setState({resolution: e.target.value})
	}
  render() {
	  const {exchange, from, to, resolution, resolutionOptions} = this.state
	  const infoString = `${exchange}:${from}/${to}@${resolution}`
    return (
      <div className="App">
		<h1 className="title-pair">
		{ infoString }
		</h1>
		<select
			name="resolution"
			value={resolution}
			onChange={this.onSelectChange}
		>
			{
			resolutionOptions.map(
				e => <option key={e} value={e} >{e}</option>
				)
			}
		</select>
		<CandleStickChart
			type="hybrid"
			height={500}
			// width={1200}
			exchange={exchange}
			from={from}
			to={to}
			resolution={resolution}
		/>
      </div>
    );
  }
}

export default App;
