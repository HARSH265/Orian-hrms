import React from 'react';
import { Layout, Button, Typography, Space } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import { useNavigate, Link } from 'react-router-dom';

const { Header } = Layout;
const { Title } = Typography;

const Navbar = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth); // Check if a user is logged in

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login'); // Redirect to login page after logout
    };

    return (
        <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link to="/">
                <Title level={3} style={{ color: 'white', margin: 0 }}>
                    🚀 Orion HRMS
                </Title>
            </Link>

            {user && ( // Only show this part if the user is logged in}
                <Space>

                    {/* --- THIS IS THE NEW PART --- */}
                    {/* Only show this link if the user role is manager or higher */}
                    {(user.role === 'manager' || user.role === 'hr' || user.role === 'super-admin') && (
                        <Link to="/team">
                            <Text style={{ color: 'white' }}>My Team</Text>
                        </Link>
                    )}
                    {/* --- END OF NEW PART --- */}
                    {(user.role === 'hr' || user.role === 'super-admin') && (
                        <Link to="/admin/users">
                            <Text style={{ color: 'white' }}>User Management</Text>
                        </Link>
                    )}
                    {/* ... after the "User Management" link ...*/}
                    {(user.role === 'hr' || user.role === 'super-admin') && (
                        <Link to="/admin/departments">
                            <Text style={{ color: 'white' }}>Departments</Text>
                        </Link>
                    )}
                    <Link to="/leave"><Text style={{ color: 'white' }}>Leave</Text></Link>
                    <Link to="/profile">
                        <Text style={{ color: 'white' }}>Welcome, {user.name}!</Text>
                    </Link>

                    <Button type="primary" danger onClick={handleLogout}>
                        Logout
                    </Button>
                </Space>
            )}
        </Header>
    );
};
// Small helper component for white text. AntD v5 doesn't have Text component directly.
const Text = ({ children, ...props }) => <Typography.Text {...props}>{children}</Typography.Text>;

export default Navbar;