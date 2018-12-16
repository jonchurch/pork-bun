import React from "react";
import PropTypes from "prop-types";

//import { scaleTime } from "d3-scale";
import { format } from "d3-format";
import { timeFormat } from "d3-time-format";

import { ChartCanvas, Chart } from "react-stockcharts";
import {
	CandlestickSeries,
	VolumeProfileSeries,
	BarSeries,
} from "react-stockcharts/lib/series";
import { TrendLine, ClickCallback, DrawingObjectSelector } from 'react-stockcharts/lib/interactive'
import { XAxis, YAxis } from "react-stockcharts/lib/axes";
import {
  CrossHairCursor,
	MouseCoordinateX,
	EdgeIndicator,
	MouseCoordinateY,
	PriceCoordinate,
} from "react-stockcharts/lib/coordinates";

import { OHLCTooltip } from "react-stockcharts/lib/tooltip";
import { fitWidth } from "react-stockcharts/lib/helper";
// import { last } from "react-stockcharts/lib/utils";
import { discontinuousTimeScaleProvider } from "react-stockcharts/lib/scale";

import withRealtimeData from '../containers/RealtimeDataWrapper'
import { reduceResolution } from '../hooks'

const OFFWHITE = "#f9f9f9"
const RED = "#ef5350"
const GREEN = "#48a69a"
function blackOrRed(d) {
	return d.close > d.open ? GREEN : RED
}
const eightFixed = format(".8f")
const twoFixed = format(".2f")
class CandleStickChartForContinuousIntraDay extends React.Component {
	constructor(props) {
		super(props)
		console.log('chart constructor running', this.props)
		const { data } = props
		const range = 100
		const rightOffset = 5
		const lastBar = data[data.length - 1]
		const lastBarTs = Math.floor(lastBar.date.getTime() / 1000)
		// const xExtents = [data.length -1, Math.max(0, data.length - range)]
		const xExtents = [data.length + rightOffset, Math.max(0, data.length - range)]
		this.xExtents = xExtents
		this.priceFormat = props.data[0].close > 1 ? twoFixed : eightFixed
		const trends_1 = [
			// {
			//   start: [300, 7000],
			//   end: [500, 7000],
			//   appearance: {stroke: "red", strokeWidth: 2},
			//   type: "LINE"
		
		// },
			{
			  start: [1545116041, 7000],
			  end: [1543449600, 7000],
			  appearance: {stroke: "red", strokeWidth: 2},
			  type: "LINE"
		
		},
			{
			  start: [1543935600, 4035.10],
			  end: [1544457600, 3523.25],
			  appearance: {stroke: "green", strokeWidth: 2},
			  type: "LINE"
		
		},
		]
		this.state = {
			enableTrendLine: false,
			trends_1,
			trends_3: [],
		}
	}

	getInteractiveNodes = () => {
		// console.log('GETTING INTERACTIVE NODES:', this.interactiveNodes)
		return this.interactiveNodes
	}
	saveCanvasNode = node => this.canvasNode = node
	saveInteractiveNodes = (type, chartId) => {
		// console.log("Saving node for chart:", chartId)
		return node => {
			// console.log({node})
			if (!this.interactiveNodes) {
				this.interactiveNodes = {}
			}
			const key = `${type}_${chartId}`
			if (node || this.interactiveNodes[key]) {
				this.interactiveNodes = {
					...this.interactiveNodes,
					[key]: { type, chartId, node }
				}
			}
		}
	}
	saveInteractiveNode = chartId => 
		node => {
			this[`node_${chartId}`] = node
			// console.log('SAVE INTERACTIVENODE',{node})
		}
	handleSelection = (type, chartId) => selectionArray => {
		// console.log("HANDLE SELECTION")
		const key = `${type}_${chartId}`
		const interactive = this.state[key].map((each, idx) => ({...each, selected: selectionArray[idx]}))
		this.setState({
			[key]: interactive
		})
	}
	onDrawCompleteChart1 = trends_1 => {
		console.log({trends_1});
		// we get an array of trends with their new values
		// if its passing indexes, we need to turn them into dates
		const newTrends = trends_1.map((trend, i) => {
			// turn these indexes to dates
			const startCandle = this.props.data[trend.start[0]]
			const endCandle = this.props.data[trend.end[0]]
			const resolution = this.props.resolution === "D" ? 86400 : 3600

			console.log({resolution})
			// we need to convert an index into a future date we can store a ts for the trend xy
			const lastBar = this.props.data[this.props.data.length - 1]
			const intervalsIntoFuture = trend.start[0] - this.props.data.length
			const msToAdd = (intervalsIntoFuture * resolution) * 1000
			const newFutureDate = new Date(lastBar.date.getTime() + msToAdd).getTime() / 1000
			console.log({newFutureDate})
			// we are outputting timestamps to state
			// and handling it special if the timestamp lay outside the range of our data
			const startDate = startCandle ?
				startCandle.date.getTime() / 1000 
				: 
				newFutureDate
				
			const _intervalsIntoFuture = trend.end[0] - this.props.data.length
			const _msToAdd = (_intervalsIntoFuture * resolution) * 1000
			const _newFutureDate = new Date(lastBar.date.getTime() + _msToAdd).getTime() / 1000
			const endDate = endCandle ? 
				endCandle.date.getTime() / 1000
				: _newFutureDate
			console.log({startCandle, endCandle})
			// console.log({startDate, endDate})
			const newTrend = {
				...trend,
				start: [startDate, trend.start[1]],
				end: [endDate, trend.end[1]],
			}
			console.log('newTrends',{newTrend})
			return newTrend
			 
		})
		this.setState({
			enableTrendLine: false,
			// trends_1,
			trends_1: newTrends
		});
  }
  render() {
	  const { type, data: initialData, width, height, ratio, onLoadMore } = this.props;
	  const xScaleProvider = discontinuousTimeScaleProvider
		  .inputDateAccessor(d => d.date)
	  const {
		  data,
		  xScale,
		  xAccessor,
		  displayXAccessor
	  } = xScaleProvider(initialData)
	  // console.log('whole state in render:', this.state)
	  // const start = xAccessor(last(data));
	  // const offset = 130
	  // const n = Math.max(0, data.length - offset)
	  // const end = xAccessor(data[n]);
	  // const xExtents = [start, end];
	  // console.log({xExtents})


	  const margin = { left: 80, right: 80, top: 10, bottom: 30 }
	  const gridHeight = height - margin.top - margin.bottom;
	  const gridWidth = width - margin.left - margin.right;
	  const showGrid = true;
	  const yGrid = showGrid ? { innerTickSize: -1 * gridWidth, tickStrokeOpacity: 0.2 } : {};
	  const xGrid = showGrid ? { innerTickSize: -1 * gridHeight, tickStrokeOpacity: 0.2 } : {};
	  // I need to actually use the xAccessor and get index values for the trendlines
	  // or, I need the index of the particular bar in the data, maybe xAccessor isnt necessary
	  // regardless, I need dates to be able to pin the lines to

const storedTs = 1538524850 // non future
const futureTs = 1545116041
const resolutionSec = 86400 // day

// get closest date that's in range
const newDate = floorDate(futureTs, resolutionSec)
console.log(newDate)

function floorDate(date, coeff) {
	const ts = typeof date === 'object' ? date.getTime() / 1000 : date
	return Math.floor(date/coeff) * coeff
} 

	  const translateTrends = trend => {
		  const { type, appearance } = trend
		  let startIndex
		  let endIndex
		  const resolutionSec = this.props.resolution === "D" ? 86400 : 3600
		  // const [start] = data.filter(d => (d.date.getTime() / 1000) === trend.start[0])
		  const lastBarTs = data[data.length - 1].date.getTime() / 1000
		  const flooredStart = floorDate(trend.start[0], resolutionSec)
		  if (flooredStart > lastBarTs) {
			  // we are in the future
			  // count out how many intervals into the future we are
			  const diff = Math.floor((flooredStart - lastBarTs) / resolutionSec)
			  console.log({diff})
			  startIndex = data.length + diff - 1
		  } else {
			  startIndex = data.findIndex(e => Math.floor(e.date.getTime() / 1000) === flooredStart)
		  }
		  const flooredEnd = floorDate(trend.end[0], resolutionSec)
		  console.log({flooredEnd, flooredStart})
		  if (flooredEnd > lastBarTs) {
			  // we are in the future
			  // count out how many intervals into the future we are
			  const diff = Math.floor((flooredEnd - lastBarTs) / resolutionSec)
			  // console.log({diff})
			  endIndex = data.length + diff - 1
		  } else {
			  endIndex = data.findIndex(e => Math.floor(e.date.getTime() / 1000) === flooredEnd)
		  }
		  // const start = data.filter(d => (d.date.getTime() / 1000) <=  trend.start[0]).pop()
		  // const end = data.filter(d => (d.date.getTime() / 1000) <=  trend.end[0]).pop()
		  // console.log('TRANSLATE',{start, end})
		  // my goal here is to output position indexes, I'm supplied ts
		  const translated =  {
			  start: [startIndex, trend.start[1]],
			  end: [endIndex, trend.end[1]],
			  appearance,
			  type,
		  }
			  console.log({startIndex})
		  console.log('start end translated:',{translated})
		  return translated
	  }

    return (
		<ChartCanvas height={height}
			ref={this.saveCanvasNode}
          ratio={ratio}
          width={width}
          margin={margin}
          type={type}
		  seriesName="BTC/USD:Coinbase"
          data={data}
          xScale={xScale}
          xAccessor={xAccessor}
		  displayXAccessor={displayXAccessor}
		  xExtents={this.xExtents}
		  onLoadMore={onLoadMore}
	  >
		  <Chart id={2}
			  yExtents={[d => d.volume]}
			  height={100}
			  origin={(w,h) => [0, h - 100]}
		  >
			  {/*
			  <YAxis 
				  axisAt="left"
				  orient="left"
				  ticks={5}
				  ticksFormat={format(".2s")}
				  tickStroke={OFFWHITE}
			  />

					  */}
			  <BarSeries
					  yAccessor={d => d.volume}
					  widthRatio={0.95}
					  opacity={0.4}
					  fill={blackOrRed}
					  stroke={false}
				  />
		  </Chart>
        <Chart id={1}
            yExtents={[d => [d.high, d.low]]}
			padding={{ top: 20, bottom: 40 }}>

		  <OHLCTooltip origin={[-40, 0]} textFill={OFFWHITE}/>
          <XAxis axisAt="bottom" orient="bottom" ticks={13} tickStroke={OFFWHITE} {...xGrid} />
          <YAxis axisAt="right" tickFormat={this.priceFormat} orient="right" ticks={12} tickStroke={OFFWHITE} {...yGrid} />

          <MouseCoordinateX
            rectWidth={80}
            at="bottom"
            orient="bottom"
			displayFormat={timeFormat("%d/%m %H:%M")} 
		/>
          <MouseCoordinateY
            at="right"
            orient="left"
			displayFormat={this.priceFormat} 
		/>

	
		<CandlestickSeries 
			stroke={"none"}
			wickStroke={blackOrRed}
			fill={blackOrRed}
			opacity={1}
			widthRatio={0.75}
		/>
		<TrendLine 
			ref={this.saveInteractiveNodes("Trendline", 1)}
			enabled={this.state.enableTrendLine}
			type="LINE"
			snap={false}
			// snapTo={d => [d.high, d.low]}
			// onStart={() => console.log('Trendline start drag')}
			onComplete={this.onDrawCompleteChart1}
			// trends={this.state.trends_1}
			trends={this.state.trends_1.map(translateTrends)}
		/>

	<PriceCoordinate 
		at="right"
		orient="right"
		price={data[data.length - 1].close}
		displayFormat={format(".2f")}
		stroke={blackOrRed(data[data.length - 1])}
		fill={blackOrRed(data[data.length -1])}
		lineStroke={blackOrRed(data[data.length - 1])}
		strokeDasharray="ShortDash"
		arrowWidth={7}
		lineOpacity={0.8}
	/>

	{/*
		<ClickCallback 
			onMouseDown={handleDebugClick}
		/>
		<EdgeIndicator 
			itemType="last"
			orient="right"
			edgeAt="right"
			yAccessor={d => d.close}
			fill={blackOrRed}
			lineStroke={blackOrRed}
			displayFormat={this.priceFormat}
		/>
				*/}
        </Chart>
		<DrawingObjectSelector
			enabled={!this.state.enableTrendLine}
			getInteractiveNodes={this.getInteractiveNodes}
			drawingObjectMap={{
			Trendline: "trends"
			}}
			onSelect={this.handleSelection}
		/>
		<CrossHairCursor stroke="#ffffff"/>
      </ChartCanvas>
    );
  }
}

function handleDebugClick(props, event) {
	const { currentItem } = props
	console.log('Click@:', currentItem.date.getTime() / 1000)

}

CandleStickChartForContinuousIntraDay.propTypes = {
  data: PropTypes.array.isRequired,
  width: PropTypes.number.isRequired,
  ratio: PropTypes.number.isRequired,
  type: PropTypes.oneOf(["svg", "hybrid"]).isRequired,
};

CandleStickChartForContinuousIntraDay.defaultProps = {
  type: "svg",
};
CandleStickChartForContinuousIntraDay = fitWidth(CandleStickChartForContinuousIntraDay);

export default withRealtimeData(CandleStickChartForContinuousIntraDay);
