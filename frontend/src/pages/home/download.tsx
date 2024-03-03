import {Card, Divider} from "antd";
import {useEffect, useRef, useState} from "react";
import {Chart} from "@antv/g2";
import {useRequest} from "ahooks";
import * as api from "../../apis/home.ts";
import {bytesToSize} from "../../utils/util.ts";


function Download() {

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

    const {run} = useRequest(api.getDownloadInfo, {
        manual: true,
        onSuccess: (response) => {
            const line = chart.current.getNodesByType("line")[0];
            const oldData = line.data()
            const newData = line.data().map((i: any, index: number) => {
                if (index == (oldData.length - 2)) {
                    return {...i, value: response.download_speed}
                } else if (index == (oldData.length - 1)) {
                    return {...i, value: response.upload_speed}
                } else {
                    return {...oldData[index + 2], index: i.index}
                }
            })
            line.data(newData);
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
            index: Math.floor(index / 2),
            type: (index % 2) === 0 ? 'download' : 'upload',
            value: 0
        }));

        chart.options({
            type: 'line',
            data: data,
            encode: {
                x: 'index',
                y: 'value',
                color: 'type'
            },
            axis: {
                x: {title: false, label: false, tick: false},
                y: {title: false, label: false, tick: false},
            },
            style: {
                shape: 'smooth',
            },
            interaction: {tooltip: false},
            legend: false
        })

        chart.render();
        return chart;
    }

    return (
        <Card>
            <div className={'text-lg'}>下载器</div>
            <div className={'h-20'} ref={container}></div>
            <div className={'text-center'}>
                下载：{bytesToSize(current.download_speed || 0)}
                <Divider type={'vertical'}/>
                上传：{bytesToSize(current.upload_speed || 0)}
            </div>
        </Card>
    )
}

export default Download
