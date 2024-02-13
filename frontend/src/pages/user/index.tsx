import {Card, Space} from "antd";
import UserInfo from "./info";
import UserList from "./user";
import {useSelector} from "react-redux";
import {RootState} from "../../models";

function User() {

    const {userInfo} = useSelector((state: RootState) => state.auth)

    return (
        <Space direction={'vertical'} style={{width: '100%'}}>
            <UserInfo/>
            {userInfo?.is_admin && (
                <UserList/>
            )}
        </Space>
    )
}

export default User
