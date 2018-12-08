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
		  resolution: 2 
	  }
	}
  render() {
	  const {exchange, from, to, resolution} = this.state
    return (
      <div className="App">
		<h1 className="title-pair">
		{`${exchange}:${from}/${to}@${resolution}`}
		</h1>
		<CandleStickChart 
			height={500}
			width={1200}
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
