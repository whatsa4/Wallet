import Page1 from './pages/Page1';
import Receive from './pages/Receive';
import Page3 from './pages/Page3';
import Balance from './pages/Balance';
import Send from './pages/Send';

export interface RouteType {
    path: string;
    sidebarName: string;
    element: JSX.Element;
}

const Routes: RouteType[] = [
    {
        path: '/',
        sidebarName: 'Status',
        element: <Page1></Page1>,
    },
    {
        path: '/receive',
        sidebarName: 'Receive',
        element: <Receive></Receive>,
    },
    {
        path: '/page3',
        sidebarName: 'Create Token',
        element: <Page3></Page3>,
    },
    {
        path: '/balance',
        sidebarName: 'Balance',
        element: <Balance></Balance>,
    },
    {
        path: '/send',
        sidebarName: 'Send',
        element: <Send></Send>,
    },
];

export default Routes;
