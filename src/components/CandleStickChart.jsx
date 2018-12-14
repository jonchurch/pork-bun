import React from "react";
import PropTypes from "prop-types";

import { scaleTime } from "d3-scale";
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
} from "react-stockcharts/lib/coordinates";

import { OHLCTooltip } from "react-stockcharts/lib/tooltip";
import { fitWidth } from "react-stockcharts/lib/helper";
import { last } from "react-stockcharts/lib/utils";
import { discontinuousTimeScaleProvider } from "react-stockcharts/lib/scale";

import withRealtimeData from '../containers/RealtimeDataWrapper'
const OFFWHITE = "#f9f9f9"
const RED = "#ef5350"
const GREEN = "#48a69a"
function blackOrRed(d) {
	return d.close > d.open ? GREEN : RED
}
const xAccessor = d => d.date
const eightFixed = format(".8f")
const twoFixed = format(".2f")
class CandleStickChartForContinuousIntraDay extends React.Component {
	constructor(props) {
		super()
		const { data } = props
		const range  = 180
		const offset = 15
		const xExtents = [xAccessor(data[data.length -1]), xAccessor(data[Math.max(0, data.length - range)])]
		// const xExtents = [xAccessor(data[data.length -1]), {date: new Date(1544752647000)}]
		// console.log({data})
		// const range = 180
		// const rightOffset = 10
		// const xAccessor = datum => {console.log({datum});return datum && datum.date}
		this.xExtents = xExtents
		this.priceFormat = props.data[0].close > 1 ? twoFixed : eightFixed
		const trends_1 = [
			{
			  start: [1538524800, 7000],
			  end: [1544572800, 4500],
			  appearance: {stroke: "red", strokeWidth: 2},
			  type: "LINE"
		
		},
			// {
			//   start: [1543935600, 4035.10],
			//   end: [1544457600, 3523.25],
			//   appearance: {stroke: "red", strokeWidth: 2},
			//   type: "LINE"
		
		// },
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
		const newTrends = trends_1.map((trend, i) => {
			// turn these date objects into seconds
			// const startCandle = this.props.data[trend.start[0]]
			// const endCandle = this.props.data[trend.end[0]]
			const startDate = trend.start[0].getTime() / 1000
			const endDate = trend.end[0].getTime() / 1000
			// console.log({startCandle, endCandle})
			const newTrend = {
				...trend,
				start: [startDate, trend.start[1]],
				end: [endDate, trend.end[1]],
			}
			// console.log('startdate',{newTrend})
			return newTrend
		})
		this.setState({
			enableTrendLine: false,
			trends_1: newTrends
		});
  }
  render() {
	  const { type, data, width, height, ratio, onLoadMore } = this.props;
	  const xScale = scaleTime()
	  const xAccessor = datum => datum && datum.date
	  // const xScaleProvider = discontinuousTimeScaleProvider
		  // .inputDateAccessor(d => d.date)
	  // const {
		  // data,
		  // xScale,
		  // xAccessor,
		  // displayXAccessor
	  // } = xScaleProvider(initialData)
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

	  const translateTrends = trend => {
		  console.log('translate this trend', trend)
		  const { type, appearance } = trend
		  const start = data.filter(d => (d.date.getTime() / 1000) <=  trend.start[0]).pop()
		  const end = data.filter(d => (d.date.getTime() / 1000) <=  trend.end[0]).pop()
		  console.log('TRANSLATE',{start, end})
		  const translated =  {
			  start: [start === null ? start : xAccessor(start), trend.start[1]],
			  end: [end === null ? end : xAccessor(end), trend.end[1]],
			  appearance,
			  type,
		  }
		  console.log('start end translated trends:',{translated})
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
		  // displayXAccessor={displayXAccessor}
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
			padding={{ top: 40, bottom: 20 }}>

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
			widthRatio={0.8}
		/>
		<TrendLine 
			ref={this.saveInteractiveNodes("Trendline", 1)}
			enabled={this.state.enableTrendLine}
			type="LINE"
			snap={false}
			// snapTo={d => [d.high, d.low]}
			// onStart={() => console.log('Trendline start drag')}
			onComplete={this.onDrawCompleteChart1}
			trends={this.state.trends_1.map(translateTrends)}
		/>

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
	</Chart>
	{/*
		<DrawingObjectSelector
			enabled={!this.state.enableTrendLine}
			getInteractiveNodes={this.getInteractiveNodes}
			drawingObjectMap={{
			Trendline: "trends"
			}}
			onSelect={this.handleSelection}
		/>
	*/}
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
