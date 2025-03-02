import {GetProps, Input, InputNumber, Slider as AntSlider} from "antd";
import {useEffect, useState} from "react";

type SliderProps = GetProps<typeof AntSlider>

function Slider(props: SliderProps) {

    const {onChange, value, ...otherProps} = props
    const [sliderValue, setSliderValue] = useState<number>(0)
    const [inputValue, setInputValue] = useState(props.value?.toString());

    useEffect(() => {
        setSliderValue(value as any)
    }, [value])

    return (
        <div className={'flex'}>
            <AntSlider className={'flex-1'} {...otherProps}
                       value={sliderValue as any}
                       onChange={(value: any) => {
                           setSliderValue(value)
                           setInputValue(value)
                       }}
                       onChangeComplete={(value: any) => {
                           setSliderValue(value)
                           setInputValue(value)
                           onChange?.(value)
                       }}
            />
            <Input value={inputValue}
                   onChange={(event) => {
                       setInputValue(event.target.value)
                       if (!isNaN(Number(event.target.value))) {
                           onChange?.(event.target.value as any)
                       }
                   }}
                   className={'w-12 ml-2'}/>
        </div>
    )
}

export default Slider
