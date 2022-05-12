import { FC, useState, useContext, useEffect } from 'react';
import {
    Grid,
    Card,
    CardContent,
    TextField,
    Button,
    Stack,
    CardMedia,
    Typography,
    CardActions,
    Portal,
    Snackbar,
    Alert,
} from '@mui/material';
import MiniModal from '../shared/components/MiniModal';

import { callCreateNFT } from '../minima/rpc-commands';

/** form imports */
import { useFormik } from 'formik';
import { BalanceUpdates } from '../App'; // balance context

import { MinimaToken } from '../types/minima';
import AppPagination from './components/AppPagination';

import * as Yup from 'yup';
import { INSUFFICIENT } from '../minima/constants';

import PreviewNFTModal from '../shared/components/PreviewNFTModal';

const NFTs: FC = () => {
    const balances = useContext(BalanceUpdates);
    const [allNFTs, setAllNFTs] = useState<MinimaToken[]>([]);
    const [page, setPage] = useState(1);
    const COUNT_PER_PAGE = 2;

    useEffect(() => {
        const allNFTs: MinimaToken[] = balances.filter((b: MinimaToken) => {
            if (typeof b.token !== 'string' && b.token.nft) {
                return b;
            }
        });

        setAllNFTs(allNFTs);
    }, [balances]);

    const currentPage = (page: number) => {
        // console.log(`Setting current page number to: ${page}`);
        setPage(page);
    };

    return (
        <>
            <Grid container mt={2} mb={2}>
                <Grid item xs={0} md={2}></Grid>
                <Grid container item xs={12} md={8} spacing={2}>
                    <Grid container item xs={12} spacing={2}>
                        <Grid item xs={12}>
                            <Card variant="outlined">
                                <CardContent>
                                    <AllNFTs nfts={allNFTs} page={page} count={COUNT_PER_PAGE} />
                                </CardContent>
                                <CardActions sx={{ justifyContent: 'center', display: 'flex' }}>
                                    <AppPagination currentPage={currentPage} totalNFTs={allNFTs.length} />
                                </CardActions>
                            </Card>
                        </Grid>
                    </Grid>

                    <Grid item xs={12}>
                        <CreateNFTForm />
                    </Grid>
                </Grid>
                <Grid item xs={0} md={2}></Grid>
            </Grid>
        </>
    );
};

interface NFT {
    url: string;
    name: string;
    description: string;
    size: number;
}

interface allProps {
    page: number;
    count: number;
    nfts: MinimaToken[];
}
const AllNFTs = ({ page, count, nfts }: allProps) => {
    return (
        <Grid item container xs={12} spacing={2}>
            {nfts.slice((page - 1) * count, page * count).map((b: MinimaToken) => {
                return <NFTListItem name={b.token.name} url={b.token.url} description={b.token.description} size={6} />;
            })}
            {nfts.length === 0 ? (
                <Stack justifyContent="center">
                    <Typography variant="subtitle1">Your collection will appear here.</Typography>
                </Stack>
            ) : null}
        </Grid>
    );
};
/** Each NFT */
const NFTListItem: FC<NFT> = ({ url, name, description, size }) => {
    return (
        <>
            <Grid item xs={size}>
                <Card sx={NFTCard} variant="outlined">
                    <CardMedia component="img" src={url} />
                    <CardContent>
                        <Stack direction="row" justifyContent={'space-between'}>
                            <Stack>
                                <Typography
                                    sx={{
                                        fontWeight: 600,
                                        fontSize: 12,
                                        display: '-webkit-box',
                                        overflow: 'hidden',
                                        WebkitBoxOrient: 'vertical',
                                        WebkitLineClamp: 1,
                                    }}
                                    variant="h6"
                                >
                                    {name}
                                </Typography>
                                <Typography
                                    sx={{
                                        fontWeight: 100,
                                        fontSize: 10,
                                        display: '-webkit-box',
                                        overflow: 'hidden',
                                        WebkitBoxOrient: 'vertical',
                                        WebkitLineClamp: 1,
                                    }}
                                    variant="subtitle1"
                                >
                                    {description}
                                </Typography>
                            </Stack>
                            {/* <Stack>
                                <Typography sx={{ fontWeight: 600, fontSize: 12 }} variant="h6">
                                    Total
                                </Typography>
                                <Typography sx={{ fontWeight: 100, fontSize: 10 }} variant="subtitle1">
                                    Subtitle
                                </Typography>
                            </Stack> */}
                        </Stack>
                    </CardContent>
                </Card>
            </Grid>
        </>
    );
};

const CreateTokenSchema = Yup.object().shape({
    name: Yup.string()
        .required('Field Required')
        .matches(/^[^\\;'"]+$/, 'Invalid characters.'),
    description: Yup.string()
        .min(0)
        .max(255, 'Maximum 255 characters allowed.')
        .matches(/^[^\\;'"]+$/, 'Invalid characters.'),
    url: Yup.string()
        .matches(/^[^\\;'"]+$/, 'Invalid characters.')
        .required('Field Required'),
});
/** NFT form creator */
const CreateNFTForm: FC = () => {
    const [openPreviewModal, setOpenPreviewModal] = useState(false);
    const [open, setOpen] = useState(false);
    const [modalStatus, setModalStatus] = useState('Failed');
    const [errMessage, setErrMessage] = useState('');

    const handleOpen = () => setOpen(true);
    const handleClose = () => {
        setOpen(false);
        setModalStatus('Failed');
    };

    const formik = useFormik({
        initialValues: {
            name: '',
            url: '',
            description: '',
        },
        validationSchema: CreateTokenSchema,
        onSubmit: (data) => {
            console.log(`Minting NFT ${data.name}`);
            const customNFT = {
                name: data.name,
                url: data.url,
                description: data.description,
            };
            callCreateNFT(customNFT)
                .then(() => {
                    formik.resetForm();
                    // Set Modal
                    setModalStatus('Success');
                    // Open Modal
                    setOpen(true);
                })
                .catch((err) => {
                    console.log(err);

                    if (err === undefined || err.message === undefined) {
                        setErrMessage('Something went wrong!  Open a Discord Support ticket for assistance.');
                        // alert('Something went wrong, error message undefined.  Open a support ticket!');
                    }

                    if (err.message !== undefined && err.message.substring(0, 20) === INSUFFICIENT) {
                        formik.setFieldError('amount', err.message);
                    } else {
                        setErrMessage(err.message);
                    }
                })
                .finally(() => {
                    // NO MATTER WHAT
                    formik.setSubmitting(false);
                    setTimeout(() => setErrMessage(''), 2500);
                });
        },
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

            <Card variant="outlined">
                <CardContent>
                    <form onSubmit={formik.handleSubmit}>
                        <TextField
                            fullWidth
                            id="name"
                            name="name"
                            placeholder="name"
                            value={formik.values.name}
                            onChange={formik.handleChange}
                            error={formik.touched.name && Boolean(formik.errors.name)}
                            helperText={formik.touched.name && formik.errors.name}
                            sx={{ mb: 2 }}
                            FormHelperTextProps={{
                                style: styles.helperText,
                            }}
                            InputProps={{
                                style:
                                    formik.touched.name && Boolean(formik.errors.name)
                                        ? { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }
                                        : { borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
                            }}
                        ></TextField>
                        <TextField
                            fullWidth
                            id="url"
                            name="url"
                            placeholder="url"
                            value={formik.values.url}
                            onChange={formik.handleChange}
                            error={formik.touched.url && Boolean(formik.errors.url)}
                            helperText={formik.touched.url && formik.errors.url}
                            sx={{ mb: 2 }}
                            InputProps={{
                                style:
                                    formik.touched.url && Boolean(formik.errors.url)
                                        ? { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }
                                        : { borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
                            }}
                        ></TextField>
                        <TextField
                            fullWidth
                            id="description"
                            name="description"
                            placeholder="description"
                            value={formik.values.description}
                            onChange={formik.handleChange}
                            error={formik.touched.description && Boolean(formik.errors.description)}
                            helperText={formik.touched.description && formik.errors.description}
                            multiline
                            rows={4}
                            sx={{ mb: 2 }}
                        ></TextField>
                        <Button
                            disabled={formik.isSubmitting && !formik.isValid}
                            disableElevation
                            color="primary"
                            variant="contained"
                            fullWidth
                            type="submit"
                            sx={{ marginBottom: 2 }}
                        >
                            {formik.isSubmitting ? 'Minting...' : 'Mint'}
                        </Button>
                        <Button
                            disabled={!formik.dirty || !formik.isValid}
                            disableElevation
                            color="primary"
                            variant="outlined"
                            fullWidth
                            onClick={() => setOpenPreviewModal(true)}
                        >
                            Preview
                        </Button>
                        <MiniModal
                            open={open}
                            handleClose={handleClose}
                            handleOpen={handleOpen}
                            header={modalStatus === 'Success' ? 'Success!' : 'Failed!'}
                            status="Transaction Status"
                            subtitle={modalStatus === 'Success' ? 'NFT minted.' : 'Please try again later.'}
                        />
                        <PreviewNFTModal
                            open={openPreviewModal}
                            handleClose={() => setOpenPreviewModal(false)}
                            name={formik.values.name}
                            url={formik.values.url}
                            description={formik.values.description}
                        />
                    </form>
                </CardContent>
            </Card>
        </>
    );
};

const styles = {
    helperText: {
        borderBottomRightRadius: 8,
        borderBottomLeftRadius: 8,
        color: '#363A3F',
        fontWeight: '400',
        paddingLeft: 8,
    },
};

const NFTCard = {
    '&:hover': {
        cursor: 'pointer',
        border: '1px solid',
        padding: '0px',
        boxShadow: '0px 3px 1px -2px #FF7357,0px 2px 2px 0px #317aff,0px 1px 5px 0px rgba(0,0,0,0.12)',
    },
    // height: '100%',
};

/**
 * Abstracting Grid container + items
 * 
 * const Container = props => <Grid container {...props} />;
   const Item = props => <Grid item {...props} />;

 */

export { NFTs, NFTListItem };
