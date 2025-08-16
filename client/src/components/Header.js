import { Layout, Button, Space, Typography } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';
const { Header: AntHeader } = Layout;
const { Text } = Typography;

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <AntHeader style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
      {user && (
        <Space size="large">
          <NotificationBell />
          <Text>Welcome, {user.name}!</Text>
          <Button type="primary" danger onClick={handleLogout}>
            Logout
          </Button>
        </Space>
      )}
    </AntHeader>
  );
};

export default Header;