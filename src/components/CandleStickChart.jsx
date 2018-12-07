import React from "react";
import PropTypes from "prop-types";

import { scaleTime } from "d3-scale";
import { format } from "d3-format";
import { timeFormat } from "d3-time-format";

import { ChartCanvas, Chart } from "react-stockcharts";
import {
  BarSeries,
  CandlestickSeries,
} from "react-stockcharts/lib/series";
import { XAxis, YAxis } from "react-stockcharts/lib/axes";
import {
  CrossHairCursor,
  EdgeIndicator,
  CurrentCoordinate,
  MouseCoordinateX,
  MouseCoordinateY,
} from "react-stockcharts/lib/coordinates";

import { OHLCTooltip } from "react-stockcharts/lib/tooltip";
import { fitWidth } from "react-stockcharts/lib/helper";
import { last } from "react-stockcharts/lib/utils";
import { discontinuousTimeScaleProvider } from "react-stockcharts/lib/scale";


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
	  const n = Math.max(0, data.length - 289)
    const end = xAccessor(data[n]);
    const xExtents = [start, end];

    return (
      <ChartCanvas height={height}
          ratio={ratio}
          width={width}
          margin={{ left: 80, right: 80, top: 10, bottom: 30 }}
          type={type}
          seriesName="MSFT"
          data={data}
          xScale={scaleTime()}
          xAccessor={xAccessor}
		  displayXAccessor={displayXAccessor}
		  xExtents={xExtents}>
        <Chart id={1}
            yExtents={[d => [d.high, d.low]]}
            padding={{ top: 40, bottom: 20 }}>
          <XAxis axisAt="bottom" orient="bottom"/>
          <YAxis axisAt="left" orient="left" ticks={5} />

          <MouseCoordinateX
            rectWidth={80}
            at="bottom"
            orient="bottom"
            displayFormat={timeFormat("%d/%m %H:%M")} />
          <MouseCoordinateY
            at="left"
            orient="left"
            displayFormat={format(".2f")} />

          <CandlestickSeries />
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

export default CandleStickChartForContinuousIntraDay;
