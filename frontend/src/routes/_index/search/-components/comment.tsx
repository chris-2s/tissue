import {List, Rate, Space, Statistic, theme} from "antd";
import {LikeOutlined} from "@ant-design/icons";
import type {VideoCommentItem} from "../../../../types/video";

function Comment(props: { data: VideoCommentItem[] }) {
    const {data} = props;
    const {token} = theme.useToken()
    return (
        <List dataSource={data}
              renderItem={(item) => (
                  <List.Item>
                      <List.Item.Meta
                          title={(
                              <div className={'flex'}>
                                  <Space className={'flex-1'}>
                                      <div>{item.name}</div>
                                      <div><Rate value={item.score} disabled/></div>
                                      <div>{item.publish_date}</div>
                                  </Space>
                                  <div>
                                      <LikeOutlined/>
                                      <span className={'ml-2'}>{item.likes}</span>
                                  </div>
                              </div>
                          )}
                          description={(
                              <div className={'whitespace-pre-wrap wrap-anywhere'}
                                   style={{color: token.colorTextSecondary}}>{item.content}</div>
                          )}
                      />
                  </List.Item>
              )}
        />
    )
}

export default Comment;
