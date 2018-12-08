import React from "react";
import PropTypes from "prop-types";

import { scaleTime } from "d3-scale";
import { format } from "d3-format";
import { timeFormat } from "d3-time-format";

import { ChartCanvas, Chart } from "react-stockcharts";
import {
  CandlestickSeries,
} from "react-stockcharts/lib/series";
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

function blackOrRed(d) {
const RED = "#ef5350"
const GREEN = "#48a69a"
	return d.close > d.open ? GREEN : RED
}

class CandleStickChartForContinuousIntraDay extends React.Component {
  render() {
	  const { type, data: initialData, width, height, ratio } = this.props;
	  const xScaleProvider = discontinuousTimeScaleProvider
		  .inputDateAccessor(d => d.date)
	  const {
		  data,
		  xScale,
		  xAccessor,
		  displayXAccessor
	  } = xScaleProvider(initialData)

    // const xAccessor = d => d.date;
	  const start = xAccessor(last(data));
	  const offset = 130
	  const n = Math.max(0, data.length - offset)
	  const end = xAccessor(data[n]);
	  const xExtents = [start, end];

	  const margin = { left: 80, right: 80, top: 10, bottom: 30 }
	  const gridHeight = height - margin.top - margin.bottom;
	  const gridWidth = width - margin.left - margin.right;
	  const showGrid = true;
	  const yGrid = showGrid ? { innerTickSize: -1 * gridWidth, tickStrokeOpacity: 0.2 } : {};
	  const xGrid = showGrid ? { innerTickSize: -1 * gridHeight, tickStrokeOpacity: 0.2 } : {};


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
		  xExtents={xExtents}>
        <Chart id={1}
            yExtents={[d => [d.high, d.low]]}
            padding={{ top: 40, bottom: 20 }}>
          <XAxis axisAt="bottom" orient="bottom" ticks={12} tickStroke="#f9f9f9" {...xGrid} />
          <YAxis axisAt="right" orient="right" ticks={12} tickStroke="#f9f9f9" {...yGrid} />

          <MouseCoordinateX
            rectWidth={80}
            at="bottom"
            orient="bottom"
            displayFormat={timeFormat("%d/%m %H:%M")} />
          <MouseCoordinateY
            at="right"
            orient="left"
            displayFormat={format(".2f")} />

		<CandlestickSeries 
			stroke={"none"}
			wickStroke={blackOrRed}
			fill={blackOrRed}
			opacity={1}
			widthRatio={0.8}
		/>
		<EdgeIndicator 
			itemType="last"
			orient="right"
			edgeAt="right"
			yAccessor={d => d.close}
			fill={blackOrRed}
			lineStroke={blackOrRed}
		/>
        </Chart>
        <CrossHairCursor />
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
