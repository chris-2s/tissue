import React, {useEffect, useState} from "react";
import {Col, GetProp, Row} from "antd";

type ColSpan = GetProp<typeof Col, 'span'>

export interface FilterField {
    dataIndex: string,
    label: string,
    component: React.ReactElement
    span?: { xs?: number, md?: number, lg?: number }
}

interface FilterProps extends React.ComponentProps<any> {
    fields: FilterField[]
    initialValues: object
    onChange: (values: object, filed?: string) => void
}

function Filter(props: FilterProps) {

    const {fields, initialValues = {}, onChange, ...others} = props
    const [values, setValues] = useState<any>(initialValues)

    function renderFields(field: FilterField) {

        const child = React.cloneElement(field.component, {
            value: values[field.dataIndex],
            onChange: (value: object) => {
                const newValues = {...values, [field.dataIndex]: value}
                setValues(newValues)
                onChange?.(newValues, field.dataIndex)
            }
        })

        return (
            <Col key={field.dataIndex} {...field.span} className={'flex items-center h-12'}>
                <div className={'mr-3'}>{field.label}</div>
                <div className={'flex-1'}>
                    {child}
                </div>
            </Col>
        )
    }

    return (
        <Row {...others}>
            {fields.map(field => renderFields(field))}
        </Row>
    )
}

export default Filter;
