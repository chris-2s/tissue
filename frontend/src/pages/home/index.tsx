import {Col, Row, theme} from "antd";
import React from "react";
import Cpu from "./cpu.tsx";
import Memory from "./memory.tsx";
import Download from "./download.tsx";
import Disk from "./disk.tsx";
import Video from "./video.tsx";


const {useToken} = theme

function Home() {
    return (
        <Row gutter={[15, 15]}>
            <Col lg={6} span={24}>
                <Cpu/>
            </Col>
            <Col lg={6} span={24}>
                <Memory/>
            </Col>
            <Col lg={12} span={24}>
                <Download/>
            </Col>
            <Col lg={12} span={24}>
                <Disk/>
            </Col>
            <Col lg={12} span={24}>
                <Video/>
            </Col>
        </Row>
    )
}

export default Home
