import {Card} from "antd";
import {useEffect, useRef, useState} from "react";
import {Chart} from "@antv/g2";
import {useRequest} from "ahooks";
import * as api from "../../apis/home.ts";
import {bytesToSize} from "../../utils/util.ts";


function Cpu() {

    const container = useRef<any>(null);
    const chart = useRef<any>(null);
    const [current, setCurrent] = useState<any>({})

    useEffect(() => {
        if (!chart.current) {
            chart.current = renderChart(container.current);
        }
        run()
        const interval = setInterval(run, 5000)
        return () => {
            clearInterval(interval)
        }
    }, []);

    const {run} = useRequest(api.getMemoryInfo, {
        manual: true,
        onSuccess: (response) => {
            const area = chart.current.getNodesByType("area")[0];
            const oldData = area.data()
            const newData = area.data().map((i: any, index: number) => {
                if (index == (oldData.length - 1)) {
                    return {...i, ...response}
                } else {
                    return {...oldData[index + 1], index: index}
                }
            })
            area.data(newData);
            area.scale({y: {domain: [0, response.total]}})
            chart.current.render();
            setCurrent(response)
        }
    })

    function renderChart(container: any) {
        const chart = new Chart({
            container,
            autoFit: true
        });

        const data = new Array(60).fill(0).map((_, index) => ({
            total: 0,
            available: 0,
            index: index
        }));

        chart.options({
            type: 'area',
            data: data,
            encode: {
                x: 'index',
                y: 'available',
            },
            axis: {
                x: {title: false, label: false, tick: false},
                y: {title: false, label: false, tick: false},
            },
            style: {
                shape: 'smooth',
                fill: 'indianred'
            },
            interaction: {tooltip: false}
        })

        chart.render();
        return chart;
    }

    return (
        <Card className={'pointer-events-none'}>
            <div className={'text-lg'}>可用内存</div>
            <div className={'h-20'} ref={container}></div>
            <div className={'text-center'}>当前可用：{bytesToSize(current.available || 0)}</div>
        </Card>
    )
}

export default Cpu
