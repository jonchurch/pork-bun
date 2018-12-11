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
import { TrendLine } from 'react-stockcharts/lib/interactive'
import { XAxis, YAxis } from "react-stockcharts/lib/axes";
import {
  CrossHairCursor,
	MouseCoordinateX,
	EdgeIndicator,
  MouseCoordinateY,
} from "react-stockcharts/lib/coordinates";

import { OHLCTooltip } from "react-stockcharts/lib/tooltip";
import { fitWidth } from "react-stockcharts/lib/helper";
// import { last } from "react-stockcharts/lib/utils";
import { discontinuousTimeScaleProvider } from "react-stockcharts/lib/scale";

import withRealtimeData from '../containers/RealtimeDataWrapper'
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
		super()
		const { data } = props
		const offset = 130
		const xExtents = [data.length -1, Math.max(0, data.length - offset)]
		this.xExtents = xExtents
		this.priceFormat = props.data[0].close > 1 ? twoFixed : eightFixed
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

	  const mockTrends = [{
		  start: [data.length - 70, 7387],
		  end: [data.length - 5, 7387],
		  appearance: {stroke: "red", strokeWidth: 2},
		  type: "LINE"
	  },
		  {
	  start: [data.length - 70, 3700],
	  end: [data.length - 5, 3700],
	  appearance: {stroke: "red", strokeWidth: 2},
	  type: "XLINE"
  }]

    return (
      <ChartCanvas height={height}
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
			type="LINE"
			trends={mockTrends}
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
		<CrossHairCursor stroke="#ffffff"/>
      </ChartCanvas>
    );
  }
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
