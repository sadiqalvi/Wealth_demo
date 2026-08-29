"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export function YieldTrendChart({
  categories,
  series,
  seriesName = "Series",
  valueDecimals = 2,
  yAxisMin,
  yAxisMax,
  yAxisPrefix = "Rs. "
}: {
  categories: string[];
  series: number[];
  seriesName?: string;
  /** Decimal places for Y-axis and tooltip when showing PKR-style values. */
  valueDecimals?: number;
  /** Tight Y-axis (magnifying glass); omit for auto scale. */
  yAxisMin?: number;
  yAxisMax?: number;
  /** Set to "" for YTM % charts. */
  yAxisPrefix?: string;
}) {
  const options: ApexOptions = {
    chart: {
      toolbar: { show: false },
      sparkline: { enabled: false },
      animations: { speed: 500 }
    },
    colors: ["#00A599"],
    dataLabels: { enabled: false },
    grid: {
      borderColor: "#E5E7EB",
      strokeDashArray: 4
    },
    stroke: {
      curve: "smooth",
      width: 3
    },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          colors: "#667085",
          fontSize: "11px"
        }
      }
    },
    yaxis: {
      min: yAxisMin,
      max: yAxisMax,
      labels: {
        formatter(value) {
          if (yAxisPrefix === "") {
            return `${Number(value).toFixed(2)}%`;
          }
          return `${yAxisPrefix}${Number(value).toFixed(valueDecimals)}`;
        },
        style: {
          colors: "#667085",
          fontSize: "11px"
        }
      }
    },
    tooltip: {
      y: {
        formatter(value) {
          if (yAxisPrefix === "") {
            return `${Number(value).toFixed(2)}%`;
          }
          return `${yAxisPrefix}${Number(value).toFixed(Math.max(valueDecimals, 2))}`;
        }
      }
    }
  };

  return <ReactApexChart type="line" height={260} series={[{ name: seriesName, data: series }]} options={options} />;
}
