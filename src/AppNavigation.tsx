import { IconButton, Toolbar, AppBar, Grid, Drawer, Box, Container, Typography, Stack } from '@mui/material';
import { useEffect, useState } from 'react';
import { Routes, Route, useLocation, Navigate, useNavigate, Outlet } from 'react-router-dom';

import MenuIcon from '@mui/icons-material/Menu';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import Balance from './pages/Balance';
import Send from './pages/Send';
import Status from './pages/Status';
import Receive from './pages/Receive';
import TokenCreation from './pages/TokenCreation';
import TokenDetail from './pages/TokenDetail';
import { DRAWERWIDTH } from './shared/constants';
import SideMenu from './layout/SideMenu';
import Offline from './pages/Offline';
import NFTs from './pages/NFTs';
import MiningCog from './pages/components/mining/MiningCog';
import { useAppSelector } from './minima/redux/hooks';
import { selectMiningState } from './minima/redux/slices/miningSlice';
import CreateNFT from './pages/components/nfts/CreateNFT';
import NFTDetail from './pages/NFTDetail';
import { selectBalance } from './minima/redux/slices/balanceSlice';
import { NoResults } from './shared/components/layout/MiToken';

export interface RouteType {
    path: string;
    sidebarName: string;
    element: JSX.Element;
}

const AppNavigation = () => {
    const [open, setOpen] = useState(false);
    const [pageTitle, setPageTitle] = useState('Balance');
    const isMining = useAppSelector(selectMiningState);
    const wallet = useAppSelector(selectBalance);

    // Back Button
    const [onDetail, setOnDetail] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const handleDrawerOpen = () => {
        return open === false ? setOpen(true) : null;
    };

    const handleDrawerClose = () => {
        return open === true ? setOpen(false) : null;
    };

    const DrawerItems = [
        {
            pathname: '/balance',
            name: 'Balance',
        },
        {
            pathname: '/send',
            name: 'Send',
        },
        {
            pathname: '/receive',
            name: 'Receive',
        },
        {
            pathname: '/status',
            name: 'Status',
        },
        {
            pathname: '/tokencreate',
            name: 'Create Token',
        },
        {
            pathname: '/nfts',
            name: 'NFTs',
        },
        {
            pathname: '/createnft',
            name: 'Create NFT',
        },
        {
            pathname: '/offline',
            name: 'Node Status',
        },
    ];

    useEffect(() => {
        getPageTitle();
        setOnDetail(false);
        if (location.pathname.substring(0, 9) === '/balance/') {
            // console.log('Token Detail page');
            setOnDetail(true);
            setPageTitle('Token Details');
        }
        if (location.pathname.substring(0, 6) === '/nfts/') {
            // console.log('Token Detail page');
            setOnDetail(true);
            setPageTitle('NFT Details');
        }

        if (location.pathname.substring(0, 10) === '/createnft') {
            // console.log('Token Detail page');
            setOnDetail(true);
        }
        return () => {};
    }, [location]);

    const getPageTitle = () => {
        DrawerItems.forEach((p) => {
            if (p.pathname === location.pathname) {
                setPageTitle(p.name);
            }
        });
    };

    return (
        <>
            <Toolbar sx={[start, appwidth]} variant="dense">
                <Grid container>
                    <Grid xs={0} md={2} item />
                    <Grid
                        xs={12}
                        md={8}
                        item
                        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                        <Stack direction="row">
                            {onDetail ? null : (
                                <IconButton
                                    sx={{ display: { xs: 'flex', sm: 'none' }, padding: 0, marginRight: 0.5 }}
                                    color="inherit"
                                    aria-label="menu"
                                    onClick={handleDrawerOpen}
                                >
                                    <MenuIcon />
                                </IconButton>
                            )}
                            {onDetail ? (
                                <IconButton
                                    sx={{ padding: 0, marginRight: 0.5 }}
                                    onClick={() => {
                                        navigate(-1);
                                    }}
                                >
                                    <ArrowBackIcon sx={{ color: '#fff' }} />
                                </IconButton>
                            ) : null}
                            <Typography variant="body1" sx={{ fontWeight: '700' }}>
                                {pageTitle}
                            </Typography>
                        </Stack>

                        <MiningCog isMining={isMining} />
                    </Grid>
                    <Grid xs={0} md={2} item />
                </Grid>
            </Toolbar>

            <Box component="main" sx={[appwidth, contentPadding]}>
                {wallet.length ? (
                    <Routes>
                        <Route path="/" element={<Navigate replace to="/balance" />} />
                        <Route path="/balance" element={<Balance />} />
                        <Route path="balance/:tokenid" element={<TokenDetail />} />
                        <Route path="/send" element={<Send />} />
                        <Route path="send/:tokenid" element={<Send />} />
                        <Route path="/receive" element={<Receive />} />
                        <Route path="/status" element={<Status />} />
                        <Route path="/tokencreate" element={<TokenCreation />} />
                        <Route path="/nfts" element={<NFTs />}></Route>
                        <Route path="nfts/:tokenid" element={<NFTDetail />} />
                        <Route path="/createnft" element={<CreateNFT />} />
                        <Route path="/offline" element={<Offline />} />
                        <Route path="*" element={<Navigate replace to="/balance" />} />
                    </Routes>
                ) : (
                    <Stack alignItems="center" justifyContent="center">
                        <NoResults>
                            <h6>Oops, your node is offline</h6>
                            <p>Check your node status or refresh this page</p>
                        </NoResults>
                    </Stack>
                )}
            </Box>
            <Box component="nav" sx={nav} aria-label="mailbox folders">
                <Drawer
                    variant="temporary"
                    open={open}
                    onClose={handleDrawerClose}
                    ModalProps={{ keepMounted: true }}
                    sx={drawerdisplay}
                >
                    <SideMenu handleDrawerOpen={handleDrawerOpen} handleDrawerClose={handleDrawerClose} />
                </Drawer>
                <Drawer variant="permanent" sx={drawerdisplaydesktop}>
                    <SideMenu handleDrawerOpen={handleDrawerOpen} handleDrawerClose={handleDrawerClose} />
                </Drawer>
            </Box>
        </>
    );
};
const nav = {
    width: { sm: DRAWERWIDTH },
    flexShrink: { sm: 0 },
};
const start = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
};
const appwidth = {
    width: { sm: `calc(100% - ${DRAWERWIDTH}px)` },
    ml: { sm: `${DRAWERWIDTH}px` },
};
const drawerdisplay = {
    display: { xs: 'block', sm: 'none' },
    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWERWIDTH },
};
const drawerdisplaydesktop = {
    display: { xs: 'none', sm: 'block' },
    '& .MuiDrawer-paper': { width: DRAWERWIDTH },
};

const contentPadding = {
    padding: { xs: '16px 8px!important' },
};

export default AppNavigation;
