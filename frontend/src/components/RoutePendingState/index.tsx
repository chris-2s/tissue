import {Skeleton} from "antd";
import React from "react";

function RoutePendingState() {
    return (
        <Skeleton active paragraph={{rows: 6}}/>
    );
}

export default RoutePendingState;
