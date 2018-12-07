import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import { getData } from './utils'

import CandleStickChart from './components/CandleStickChart'

class App extends Component {
	componentDidMount() {
		getData().then(data => {
			this.setState({ data })
		})
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
