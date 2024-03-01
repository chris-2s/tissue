import {DatePicker as AntDatePicker, DatePickerProps} from "antd";
import {useMemo} from "react";
import dayjs from "dayjs";


function DatePicker(props: DatePickerProps) {

    const {value, onChange, ...otherProps} = props

    const realValue = useMemo(() => {
        if (typeof (value) === 'string') {
            return dayjs(value)
        } else {
            return value
        }
    }, [value])


    function handleChange(_: dayjs.Dayjs | null, dateStr: string) {
        onChange?.(dateStr as any, dateStr)
    }

    return (
        <AntDatePicker {...otherProps} onChange={handleChange as any} value={realValue}/>
    )
}

export default DatePicker
