import React, { useLayoutEffect, useRef } from 'react';
import { OrgChart } from 'd3-org-chart';

const OrgChartComponent = ({ data, onDrop }) => {
    const d3Container = useRef(null);
    const chartRef = useRef(null);

    useLayoutEffect(() => {
        if (data && d3Container.current) {
            if (!chartRef.current) {
                chartRef.current = new OrgChart();
            }
            
            chartRef.current
                .container(d3Container.current)
                .data(data)
                .nodeWidth(d => 220)
                .nodeHeight(d => 120)
                .compact(false)
                .onNodeClick(d => console.log(d.data.name + ' clicked'))
                // The correct event handler for the latest versions
                .on('nodeDrop', ({ node, dropZoneNode }) => {
                    onDrop({ draggedId: node.data.id, newManagerId: dropZoneNode.data.id });
                })
                .nodeContent(function (d) {
                    return `
                        <div style="background-color:#fff; border-radius: 5px; padding: 15px; border: 1px solid #ccc; text-align: center; font-family: Arial, sans-serif;">
                            <div style="font-weight: bold; font-size: 16px; margin-bottom: 5px;">
                                ${d.data.name}
                            </div>
                            <div style="color: #555; font-size: 14px;">
                                ${d.data.title || ''}
                            </div>
                        </div>
                    `;
                })
                .render();
        }
    }, [data, onDrop]);

    return <div ref={d3Container} style={{ height: '70vh', backgroundColor: '#f5f5f5' }} />;
};

export default OrgChartComponent;