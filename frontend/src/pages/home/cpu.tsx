import {Card} from "antd";
import {useEffect, useRef, useState} from "react";
import {Chart} from "@antv/g2";
import {useRequest} from "ahooks";
import * as api from "../../apis/home.ts";


function Cpu() {

    const container = useRef<any>(null);
    const chart = useRef<any>(null);
    const [current, setCurrent] = useState(0)

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

    const {run} = useRequest(api.getCpuPercent, {
        manual: true,
        onSuccess: (response) => {
            const area = chart.current.getNodesByType("area")[0];
            const data = area.data()
            data.forEach((i: any, index: number) => {
                if (index == (data.length - 1)) {
                    i.value = response
                } else {
                    i.value = data[index + 1].value
                }
            })
            area.changeData(data);
            setCurrent(response)
        }
    })

    function renderChart(container: any) {
        const chart = new Chart({
            container,
            autoFit: true
        });

        const data = new Array(60).fill(0).map((_, index) => ({
            value: 0.0,
            index: index
        }));

        chart.options({
            type: 'area',
            data: data,
            encode: {
                x: 'index',
                y: 'value'
            },
            axis: {
                x: {title: false, label: false, tick: false},
                y: {title: false, label: false, tick: false},
            },
            style: {
                shape: 'smooth',
                fill: 'darkcyan'
            },
            scale: {y: {domain: [0, 100]}},
            interaction: {tooltip: false}
        })

        chart.render();
        return chart;
    }

    return (
        <Card>
            <div className={'text-lg'}>CPU</div>
            <div className={'h-20'} ref={container}></div>
            <div className={'text-center'}>当前占用：{current}%</div>
        </Card>
    )
}

export default Cpu
