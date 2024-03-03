import {Card, Col, Row, theme} from "antd";
import {useEffect, useRef} from "react";
import {Chart} from "@antv/g2";
import {useRequest} from "ahooks";
import * as api from "../../apis/home.ts";
import {bytesToSize} from "../../utils/util.ts";

const {useToken} = theme

const sections = [
    {type: '视频'},
    {type: '文件'},
    {type: '下载'},
]

function Disk() {

    const {token} = useToken()
    const containers = useRef<any[]>([]);
    const charts = useRef<any[]>([]);

    useEffect(() => {

    }, []);

    useRequest(api.getDiskSpace, {
        onSuccess: (response) => {
            response.forEach((item: any, index: number) => {
                charts.current[index] = renderChart(containers.current[index], item);
            })
        }
    })

    useEffect(() => {
        charts?.current.forEach(chart => {
            chart.getNodesByType('text').forEach((item: any) => {
                const style = item.style()
                style.fill = token.colorText
                item.style(style)
            })
            const item = chart.getNodesByType('interval')[0]
            const scale = item.scale()
            scale.color = {
                type: 'ordinal',
                range: [token.colorBgLayout, '#95e3b0'],
            }
            item.scale(scale)

            chart.render();
        })
    }, [token.colorText]);

    function renderChart(container: any, data: any) {
        const chart = new Chart({
            container,
            height: 200,
            autoFit: true,
        });

        data.percent = (data.available / data.total).toFixed(3)

        chart.coordinate({type: 'theta', outerRadius: 0.8, innerRadius: 0.5});

        chart.interval()
            .data([{percent: 1}, data])
            .encode('y', (d: any) => d.percent)
            .encode('color', (_: any, index: number) => index)
            .scale('y', {domain: [0, 1]})
            .scale('color', {
                type: 'ordinal',
                range: [token.colorBgLayout, '#95e3b0'],
            })
            .legend(false)
            .interaction({tooltip: false})


        chart.text()
            .style('text', data.type)
            .style('textAlign', 'center')
            .style('textBaseline', 'middle')
            .style('fontSize', 12)
            .style('fill', token.colorText)
            .style('x', '50%')
            .style('y', '50%')
            .style('dy', -10);

        chart.text()
            .style('text', bytesToSize(data.available || 0))
            .style('textAlign', 'center')
            .style('textBaseline', 'middle')
            .style('fontSize', 12)
            .style('fill', token.colorText)
            .style('x', '50%')
            .style('y', '50%')
            .style('dy', 10);

        chart.render();
        return chart;
    }

    return (
        <Card className={'pointer-events-none'}>
            <div className={'text-lg'}>磁盘</div>
            <Row>
                {sections.map((section, index) => (
                    <Col span={24} lg={8}>
                        <div ref={ref => containers.current[index] = ref}></div>
                    </Col>
                ))}
            </Row>
        </Card>
    )
}

export default Disk
