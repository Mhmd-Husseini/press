'use client';

import React, { useRef, useEffect, useState } from 'react';

interface ChartData {
  name: string;
  value: number;
  color?: string;
}

interface ChartProps {
  data: ChartData[];
  height?: number;
  colors?: string[];
  xAxisKey?: string;
  yAxisKey?: string;
}

// A simple bar chart component
export function BarChart({ data, height = 300, colors = ['#4f46e5'], xAxisKey = 'name', yAxisKey = 'value' }: ChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [maxValue, setMaxValue] = useState(0);

  useEffect(() => {
    if (data && data.length > 0) {
      const max = Math.max(...data.map(item => item.value));
      setMaxValue(max + (max * 0.1)); // Add 10% padding to the max value
    }
  }, [data]);

  return (
    <div className="w-full overflow-hidden" style={{ height: `${height}px` }}>
      <div className="flex flex-col h-full">
        <div className="flex flex-1">
          {/* Y-axis labels */}
          <div className="w-12 flex flex-col justify-between text-xs text-gray-500 pb-6">
            <div>{maxValue.toLocaleString()}</div>
            <div>{(maxValue * 0.75).toLocaleString()}</div>
            <div>{(maxValue * 0.5).toLocaleString()}</div>
            <div>{(maxValue * 0.25).toLocaleString()}</div>
            <div>0</div>
          </div>
          
          {/* Chart area */}
          <div className="flex-1 flex items-end justify-around" ref={chartRef}>
            {data.map((item, index) => {
              const heightPercent = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
              return (
                <div key={item.name} className="flex flex-col items-center flex-1">
                  <div 
                    className="w-full max-w-[50px] rounded-t-md mx-1 transition-all duration-500"
                    style={{ 
                      height: `${heightPercent}%`,
                      backgroundColor: item.color || colors[index % colors.length]
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
        
        {/* X-axis labels */}
        <div className="flex pl-12">
          {data.map((item) => (
            <div 
              key={item.name} 
              className="flex-1 text-center text-xs text-gray-600 truncate px-1"
            >
              {item.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// A simple line chart component
export function LineChart({ data, height = 300, colors = ['#4f46e5'], xAxisKey = 'name', yAxisKey = 'value' }: ChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [maxValue, setMaxValue] = useState(0);
  const [points, setPoints] = useState<string>('');

  useEffect(() => {
    if (data && data.length > 0 && chartRef.current) {
      const max = Math.max(...data.map(item => item.value));
      setMaxValue(max + (max * 0.1)); // Add 10% padding to the max value
      
      const chartWidth = chartRef.current.clientWidth;
      const chartHeight = chartRef.current.clientHeight;
      
      // Calculate horizontal spacing between points
      const xSpacing = chartWidth / (data.length - 1 || 1);
      
      // Generate line path
      const pathPoints = data.map((item, index) => {
        const x = index * xSpacing;
        const y = chartHeight - (chartHeight * (item.value / maxValue));
        return `${index === 0 ? 'M' : 'L'} ${x},${y}`;
      }).join(' ');
      
      setPoints(pathPoints);
    }
  }, [data, maxValue]);

  return (
    <div className="w-full overflow-hidden" style={{ height: `${height}px` }}>
      <div className="flex flex-col h-full">
        <div className="flex flex-1">
          {/* Y-axis labels */}
          <div className="w-12 flex flex-col justify-between text-xs text-gray-500 pb-6">
            <div>{maxValue.toLocaleString()}</div>
            <div>{(maxValue * 0.75).toLocaleString()}</div>
            <div>{(maxValue * 0.5).toLocaleString()}</div>
            <div>{(maxValue * 0.25).toLocaleString()}</div>
            <div>0</div>
          </div>
          
          {/* Chart area */}
          <div className="flex-1 relative" ref={chartRef}>
            {/* Horizontal grid lines */}
            <div className="absolute inset-0 border-b border-gray-200 h-1/4"></div>
            <div className="absolute inset-0 border-b border-gray-200 h-2/4"></div>
            <div className="absolute inset-0 border-b border-gray-200 h-3/4"></div>
            <div className="absolute inset-0 border-b border-gray-200"></div>
            
            {/* Line */}
            {points && (
              <svg className="absolute inset-0 h-full w-full">
                <path 
                  d={points} 
                  fill="none" 
                  stroke={colors[0]} 
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                
                {/* Data points */}
                {data.map((item, index) => {
                  const chartWidth = chartRef.current?.clientWidth || 0;
                  const chartHeight = chartRef.current?.clientHeight || 0;
                  const xSpacing = chartWidth / (data.length - 1 || 1);
                  const x = index * xSpacing;
                  const y = chartHeight - (chartHeight * (item.value / maxValue));
                  
                  return (
                    <circle 
                      key={index}
                      cx={x} 
                      cy={y} 
                      r="4" 
                      fill="white" 
                      stroke={colors[0]} 
                      strokeWidth="2"
                    />
                  );
                })}
              </svg>
            )}
          </div>
        </div>
        
        {/* X-axis labels */}
        <div className="flex pl-12">
          {data.map((item) => (
            <div 
              key={item.name} 
              className="flex-1 text-center text-xs text-gray-600 truncate px-1"
            >
              {item.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// A simple pie chart component
export function PieChart({ data, height = 300 }: ChartProps) {
  const [slices, setSlices] = useState<Array<{
    color: string;
    startAngle: number;
    endAngle: number;
    percent: number;
  }>>([]);
  
  useEffect(() => {
    if (data && data.length > 0) {
      const total = data.reduce((sum, item) => sum + item.value, 0);
      
      let currentAngle = 0;
      const calculatedSlices = data.map(item => {
        const percent = total > 0 ? (item.value / total) * 100 : 0;
        const angle = (percent / 100) * 360;
        
        const slice = {
          color: item.color || '#6b7280',
          startAngle: currentAngle,
          endAngle: currentAngle + angle,
          percent
        };
        
        currentAngle += angle;
        return slice;
      });
      
      setSlices(calculatedSlices);
    }
  }, [data]);

  const radius = 100;
  const centerX = 150;
  const centerY = 150;
  
  const getSlicePath = (startAngle: number, endAngle: number) => {
    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;
    
    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);
    
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
    
    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };

  return (
    <div className="flex justify-center items-center w-full" style={{ height: `${height}px` }}>
      <div className="relative h-full">
        <svg width="300" height="300" viewBox="0 0 300 300">
          {slices.map((slice, index) => (
            <path
              key={index}
              d={getSlicePath(slice.startAngle, slice.endAngle)}
              fill={slice.color}
            />
          ))}
        </svg>
        
        {/* Legend */}
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 space-y-1">
          {data.map((item, index) => (
            <div key={index} className="flex items-center text-xs">
              <div 
                className="w-3 h-3 mr-1" 
                style={{ backgroundColor: item.color || '#6b7280' }}
              ></div>
              <span>{item.name}: {slices[index]?.percent.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
