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
		  resolution: 120,
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
		<span>
			<h2 className="title-pair">
			{ infoString }
			</h2>
		<select
			className="resolution-selector"
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
		</span>
		<CandleStickChart
			type="hybrid"
			height={675}
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
