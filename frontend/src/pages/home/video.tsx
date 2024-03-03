import {Card} from "antd";
import {useEffect, useRef, useState} from "react";
import {Chart} from "@antv/g2";
import {useRequest} from "ahooks";
import * as api from "../../apis/home.ts";


function Video() {

    const container = useRef<any>(null);
    const chart = useRef<any>(null);
    const [data, setData] = useState([])

    useRequest(api.getVideoInfo, {
        onSuccess: (response) => {
            if (!chart.current) {
                setData(response)
                chart.current = renderChart(container.current, response);
            }
        }
    })

    function renderChart(container: any, response: any[]) {
        const chart = new Chart({
            container,
            autoFit: true,
            height: 200
        });

        const names: { [key: string]: number } = {}
        response.forEach(item => {
            item.actors.forEach((name: string) => {
                const count = names[name] || 0
                names[name] = count + 1
            })
        })

        const data = Object.keys(names).map(key => ({value: names[key], text: key}))

        chart.wordCloud()
            .data(data)
            .layout({
                spiral: 'rectangular',
            })
            .encode('color', 'text')
            .legend(false);
        chart.render();
        return chart;
    }

    return (
        <Card>
            <div className={'text-lg'}>影片: {data.length} 部</div>
            <div ref={container}></div>
        </Card>
    )
}

export default Video
