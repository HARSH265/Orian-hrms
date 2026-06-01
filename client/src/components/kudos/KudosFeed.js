import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { List, Spin, Typography, Alert } from 'antd';
import { fetchKudosFeed } from '../../features/kudos/kudosThunks';
import KudosCard from './KudosCard';

const { Title } = Typography;

const KudosFeed = () => {
  const dispatch = useDispatch();
  const { feed, status, error } = useSelector((state) => state.kudos);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchKudosFeed());
    }
  }, [status, dispatch]);

  if (status === 'loading') {
    return <Spin />;
  }

  if (status === 'failed') {
    return <Alert message="Error" description={error} type="error" showIcon />;
  }

  return (
    <div>
      <Title level={4} style={{ marginBottom: 20 }}>Recent Kudos</Title>
      <List
        dataSource={feed}
        renderItem={(kudos) => <KudosCard kudos={kudos} />}
        locale={{ emptyText: 'No kudos have been given yet. Be the first!' }}
      />
    </div>
  );
};

export default KudosFeed;