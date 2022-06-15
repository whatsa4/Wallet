import {
    Button,
    TextField,
    Card,
    CardContent,
    Select,
    Typography,
    Portal,
    Snackbar,
    Alert,
    ListSubheader,
    MenuItem,
} from '@mui/material';
import { FC, useContext, useState, useMemo } from 'react';
import { callSend } from '../minima/rpc-commands';

import { useFormik } from 'formik';
import * as Yup from 'yup';
import { INSUFFICIENT } from '../minima/constants';

import { MinimaToken } from '../types/minima';
import MiniModal from '../shared/components/MiniModal';

import { BalanceUpdates } from '../App';
import { useNavigate } from 'react-router-dom';
import GridLayout from './components/GridLayout';

import { checkFunds, containsText, isPropertyString } from '../shared/functions';

import TokenListItem from './components/tokens/TokenListItem';
import ConfirmationModal from './components/forms/ConfirmationModal';

const TransferTokenSchema = Yup.object().shape({
    tokenid: Yup.string().required('Field Required'),
    address: Yup.string()
        .matches(/0|M[xX][0-9a-zA-Z]+/, 'Invalid Address.')
        .min(59, 'Invalid Address, too short.')
        .max(66, 'Invalid Address, too long.')
        .required('Field Required'),
    amount: Yup.string()
        .required('Field Required')
        .matches(/^[^a-zA-Z\\;'"]+$/, 'Invalid characters.'),
    burn: Yup.string().matches(/^[^a-zA-Z\\;'"]+$/, 'Invalid characters.'),
});

const styles = {
    helperText: {
        borderBottomRightRadius: 8,
        borderBottomLeftRadius: 8,
        color: '#D63110',
        fontWeight: '700',
        paddingLeft: 8,
    },
};

const Send: FC = () => {
    const [errMessage, setErrMessage] = useState('');
    const navigate = useNavigate();
    // Handle Modal
    const [open, setOpen] = useState(false);
    // Handle Confirmation Modal
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
    const [modalStatus, setModalStatus] = useState('Failed');
    const handleOpen = () => setOpen(true);
    const handleClose = () => {
        setOpen(false);
        setModalStatus('Failed');
    };

    const handleCloseConfirmationModal = () => setOpenConfirmationModal(false);

    function handleInputChange(event: any) {
        const value = event.target.value;
        setFilterText(value);
        // when the component re-renders the updated filter text will create a new filteredBalance variable
    }

    const [filterText, setFilterText] = useState('');
    const getFilteredBalanceList = (arr: MinimaToken[], filterText: string) => {
        return arr.filter(
            (opt: MinimaToken) =>
                (isPropertyString(opt.token) && containsText(opt.token, filterText)) ||
                (!isPropertyString(opt.token) && containsText(opt.token.name, filterText)) ||
                (isPropertyString(opt.tokenid) && containsText(opt.tokenid, filterText))
        );
    };

    const balances = useContext(BalanceUpdates);
    const displayedOptions = useMemo(() => getFilteredBalanceList(balances, filterText), [balances, filterText]);
    const loading = balances.length === 0;
    if (loading) {
        navigate('/offline');
    }

    const formik = useFormik({
        initialValues: {
            tokenid: '0x00',
            amount: 0,
            address: '',
            burn: 0,
        },
        validationSchema: TransferTokenSchema,
        onSubmit: (data) => {
            callSend(data)
                .then((res: any) => {
                    if (!res.status) {
                        throw new Error(res.error ? res.error : res.message); // TODO.. consistent key value
                    }
                    // SENT
                    formik.resetForm();
                    // Close Modals
                    setOpenConfirmationModal(false);

                    // Set Modal
                    setModalStatus('Success');
                    // Open Modal
                    setOpen(true);
                })
                .catch((err) => {
                    // console.log(`Failed..`);
                    console.error(err.message);
                    setOpenConfirmationModal(false);
                    // FAILED
                    if (err.message !== undefined && err.message.substring(0, 20) === INSUFFICIENT) {
                        setErrMessage(err.message);
                        formik.setFieldError('amount', err.message);
                    } else if (err.message) {
                        setErrMessage(err.message);
                    }
                })
                .finally(() => {
                    // NO MATTER WHAT
                    formik.setSubmitting(false);
                    setTimeout(() => setErrMessage(''), 2000);
                });
        },
        validateOnChange: true,
    });

    return (
        <>
            <Portal>
                <Snackbar
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    autoHideDuration={3000}
                    onDurationChange={() => {
                        console.log('Closing...');
                    }}
                    open={errMessage.length ? true : false}
                >
                    <Alert severity="error" sx={{ backgroundColor: 'rgb(211, 47, 47)', width: '100%', color: '#fff' }}>
                        {errMessage}
                    </Alert>
                </Snackbar>
            </Portal>

            <GridLayout
                loading={loading}
                children={
                    <>
                        {/* TODO - FIX SEND WHEN NO TOKEN SELECTION WITH SEARCH */}
                        <Card variant="outlined">
                            <CardContent>
                                <form onSubmit={formik.handleSubmit}>
                                    {balances && balances.length > 0 ? (
                                        <Select
                                            MenuProps={{ autoFocus: false }}
                                            sx={{ marginBottom: 2, textAlign: 'left' }}
                                            id="tokenid"
                                            name="tokenid"
                                            value={formik.values.tokenid}
                                            onChange={formik.handleChange}
                                            error={formik.touched.tokenid && Boolean(formik.errors.tokenid)}
                                            onClose={() => setFilterText('')}
                                            fullWidth
                                            className="MiniSelect-tokens"
                                        >
                                            <ListSubheader>
                                                <TextField
                                                    autoFocus
                                                    fullWidth
                                                    placeholder="Search by name or tokenid"
                                                    id="token-search"
                                                    sx={{
                                                        position: 'relative',
                                                        zIndex: 2,
                                                        padding: '0px 8px',
                                                        margin: '8px 0px',
                                                    }}
                                                    value={filterText}
                                                    onChange={handleInputChange}
                                                    onKeyDown={(e) => {
                                                        if (e.key !== 'Escape') {
                                                            // Prevents autoselecting item while typing (default Select behaviour)
                                                            e.stopPropagation();
                                                        }
                                                    }}
                                                />
                                            </ListSubheader>
                                            {displayedOptions.length ? (
                                                displayedOptions.map((token: MinimaToken) => (
                                                    <MenuItem
                                                        sx={{ '&:hover': { background: 'transparent' } }}
                                                        value={token.tokenid}
                                                        key={token.tokenid}
                                                    >
                                                        <TokenListItem
                                                            value={token.tokenid}
                                                            key={token.tokenid}
                                                            item={token}
                                                            nav={false}
                                                        />
                                                    </MenuItem>
                                                ))
                                            ) : (
                                                <Typography p={3} variant="caption">
                                                    Token not found
                                                </Typography>
                                            )}
                                        </Select>
                                    ) : null}

                                    <TextField
                                        fullWidth
                                        id="address"
                                        name="address"
                                        placeholder="Address"
                                        value={formik.values.address}
                                        onChange={formik.handleChange}
                                        error={formik.touched.address && Boolean(formik.errors.address)}
                                        helperText={formik.touched.address && formik.errors.address}
                                        sx={{ marginBottom: 2 }}
                                        FormHelperTextProps={{
                                            style: styles.helperText,
                                        }}
                                        InputProps={{
                                            style:
                                                formik.touched.address && Boolean(formik.errors.address)
                                                    ? { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }
                                                    : { borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
                                        }}
                                    />

                                    <TextField
                                        fullWidth
                                        id="amount"
                                        name="amount"
                                        placeholder="0.0"
                                        value={formik.values.amount}
                                        onChange={formik.handleChange}
                                        error={formik.touched.amount && Boolean(formik.errors.amount)}
                                        helperText={formik.touched.amount && formik.errors.amount}
                                        sx={{ marginBottom: 2 }}
                                        FormHelperTextProps={{
                                            style: styles.helperText,
                                        }}
                                        InputProps={{
                                            style:
                                                formik.touched.amount && Boolean(formik.errors.amount)
                                                    ? { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }
                                                    : { borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
                                        }}
                                    />

                                    <Button
                                        disabled={!(formik.isValid && formik.dirty)}
                                        disableElevation
                                        color="primary"
                                        variant="contained"
                                        fullWidth
                                        onClick={() => setOpenConfirmationModal(true)}
                                    >
                                        Next
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        <ConfirmationModal
                            handleClose={handleCloseConfirmationModal}
                            open={openConfirmationModal}
                            formik={formik}
                        />

                        <MiniModal
                            open={open}
                            handleClose={handleClose}
                            handleOpen={handleOpen}
                            header={modalStatus === 'Success' ? 'Success!' : 'Failed!'}
                            status="Transaction Status"
                            subtitle={
                                modalStatus === 'Success'
                                    ? 'Your transaction will be received shortly'
                                    : 'Please try again later.'
                            }
                        />
                    </>
                }
            />
        </>
    );
};

export default Send;
