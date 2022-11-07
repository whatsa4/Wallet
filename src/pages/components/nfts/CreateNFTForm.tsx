import React from 'react';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import styles from '../../../theme/cssmodule/Components.module.css';

import ClearIcon from '@mui/icons-material/Clear';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

import { buildUserNFT } from '../../../minima/libs/nft';
import { insufficientFundsError, strToHex } from '../../../shared/functions';
import { useAppDispatch } from '../../../minima/redux/hooks';
import { toggleNotification } from '../../../minima/redux/slices/notificationSlice';
import ModalManager from '../managers/ModalManager';
import NFTConfirmation from '../forms/common/NFTConfirmation';
import MiniModal from '../../../shared/components/MiniModal';
import Pending from '../forms/Pending';
import AddImage from '../forms/AddImage';

const validation = Yup.object().shape({
    name: Yup.string()
        .required('This field is required.')
        .matches(/^[^\\;]+$/, 'Invalid characters.'),
    image: Yup.mixed().required('This field is required.'),
    amount: Yup.string()
        .required('This field is required')
        .matches(/^[^a-zA-Z\\;'"]+$/, 'Invalid characters.'),
    description: Yup.string()
        .min(0)
        .max(255, 'Maximum 255 characters allowed.')
        .matches(/^[^\\;]+$/, 'Invalid characters.'),
    burn: Yup.string().matches(/^[^a-zA-Z\\;"]+$/, 'Invalid characters.'),
    ticker: Yup.string()
        .min(0)
        .max(5, 'Maximum 5 characters allowed.')
        .matches(/^[^\\;]+$/, 'Invalid characters.'),
});

function isBlob(blob: null | Blob): blob is Blob {
    return (blob as Blob) !== null && (blob as Blob).type !== undefined;
}
const getDataUrlFromBlob = (blob: Blob): Promise<string> => {
    const copy = blob;
    return new Promise((resolve, reject) => {
        var reader = new FileReader();
        reader.readAsDataURL(copy);
        reader.onload = function () {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
            } else {
                reject('Error: could not get data url from image');
            }
        };
    });
};

const CreateNFTForm = () => {
    // Handle Modal
    const [open, setOpen] = React.useState(false);
    const [modalStatus, setModalStatus] = React.useState('Failed');
    const inp = React.useRef<any>(undefined);
    const dispatch = useAppDispatch();
    const [modalEmployee, setModalEmployee] = React.useState('');
    const [previewImage, setPreviewImage] = React.useState(undefined);
    const [file, setFile] = React.useState<File | null>(null);
    const [imageDataUrl, setImageDataUrl] = React.useState('');

    /**
     * Handles the file input for when the user wants to select an image
     * @param {string} imageDataUrl
     * @param {File} file
     * creds to dynamitesushi & neil shah
     */
    const onImageChange = (imageDataUrl: string, file: File) => {
        console.log('changing image');
        setImageDataUrl(imageDataUrl);
        setFile(file);
    };

    console.log('file', file);

    const handleTransactionStatusModalOpen = () => setOpen(true);
    const handleTransactionStatusModalClose = () => {
        setOpen(false);
        setModalStatus('Failed');
    };

    const handleClose = () => {
        setModalEmployee('');
    };
    const handleProceed = () => {
        setModalEmployee('confirmation');
    };

    React.useEffect(() => {
        return () => {
            // console.log('calling cleanup');
            URL.revokeObjectURL(previewImage ? previewImage : 'undefined');
        };
    }, []);

    const formik = useFormik({
        initialValues: {
            image: undefined,
            amount: '',
            name: '',
            description: '',
            external_url: '',
            owner: '',
            creation_date: '',
            webvalidate: '',
            burn: '',
        },
        onSubmit: (data: any) => {
            const COMPRESSION_FACTOR_LOW = 0.1;
            const COMPRESSION_FACTOR_MEDIUM = 0.5;
            const COMPRESSION_FACTOR_HIGH = 0.9;
            setModalEmployee('');

            const oNFT: any = {
                image: new File([data.image], 'imageData'),
                amount: data.amount,
                name: data.name.replaceAll(`"`, `'`),
                description: data.description.replaceAll(`"`, `'`),
                external_url: data.external_url.replaceAll(`"`, `'`),
                owner: data.owner.replaceAll(`"`, `'`),
                burn: data.burn,
                webvalidate: data.webvalidate.replaceAll(`"`, `'`),
            };

            // check if is blob
            const _isBlob = isBlob(oNFT.image);
            if (_isBlob) {
                getDataUrlFromBlob(oNFT.image)
                    .then((dataUrl) => {
                        // time to compress & send to the blockchain
                        buildUserNFT(dataUrl, COMPRESSION_FACTOR_MEDIUM, oNFT)
                            .then((result: any) => {
                                //console.log(`createNFTForm`, result);
                                if (!result.status && !result.pending) {
                                    throw new Error(result.error ? result.error : result.message);
                                }

                                // Non-write minidapp
                                if (!result.status && result.pending) {
                                    setModalStatus('Pending');
                                    setOpen(true);
                                }
                                // write Minidapp
                                if (result.status && !result.pending) {
                                    setModalStatus('Success');
                                    setOpen(true);
                                }
                                // SENT
                                formik.resetForm();
                                setPreviewImage(undefined);
                            })
                            .catch((err) => {
                                console.error('buildUserNFT', err);
                                formik.setSubmitting(false);
                                dispatch(toggleNotification(`${err}`, 'error', 'error'));

                                if (insufficientFundsError(err.message)) {
                                    formik.setFieldError('amount', err.message);
                                    dispatch(toggleNotification(`${err.message}`, 'error', 'error'));
                                }

                                if (err.message) {
                                    dispatch(toggleNotification(`${err.message}`, 'error', 'error'));
                                }
                            });
                    })
                    .catch((err) => {
                        console.error('getDataUrlFromBlob', err);
                        dispatch(toggleNotification(`${err}`, 'error', 'error'));
                        formik.setSubmitting(false);
                    });
            } else {
                console.error('Selected image is not of type Blob');
                dispatch(toggleNotification('Image is not of type Blob, please report bug to admin', 'error', 'error'));
                formik.setSubmitting(false);
            }
        },
        validationSchema: validation,
    });

    return (
        <form onSubmit={formik.handleSubmit}>
            <Stack spacing={2}>
                <Typography variant="caption">
                    <Required /> required fields
                </Typography>
                <Typography variant="h6" className={styles['form-image-title']}>
                    Image, Gif <Required />
                </Typography>
                <Typography className={styles['form-help-caption']} variant="caption">
                    File types supported: BMP, JPEG, PNG, SVG+XML, GIF.
                </Typography>
                <Box
                    component="label"
                    sx={{
                        borderColor:
                            formik.touched.image && Boolean(formik.errors.image) ? '#FCBEBD!important' : 'none',
                        padding: formik.touched.image && Boolean(formik.errors.image) ? '0!important' : '8px',
                        marginBottom: formik.touched.image && Boolean(formik.errors.image) ? '30px!important' : '8px',

                        '::after': {
                            display: formik.touched.image && Boolean(formik.errors.image) ? 'flex' : 'none',
                            content:
                                formik.touched.image && Boolean(formik.errors.image)
                                    ? `"${formik.errors.image}"`
                                    : '" "',
                            color: 'rgb(211, 47, 47)',
                            backgroundColor: '#FCBEBD',
                            width: '100%',
                            textAlign: 'center',
                            fontSize: '0.8rem',
                            fontFamily: 'Manrope-semibold',
                            padding: '5px',
                            borderBottomLeftRadius: '8px',
                            borderBottomRightRadius: '8px',
                            marginTop: '0.5px',
                        },
                    }}
                    className={styles['form-image-preview-box']}
                >
                    <AddImage
                        formik={formik}
                        textContent="Choose media"
                        onImageChange={onImageChange}
                        id="add-media-file-uploader"
                    />
                </Box>
                <TextField
                    disabled={formik.isSubmitting}
                    fullWidth
                    id="name"
                    name="name"
                    placeholder="name *"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    error={formik.touched.name && Boolean(formik.errors.name)}
                    helperText={formik.touched.name && formik.errors.name}
                    FormHelperTextProps={{ className: styles['form-helper-text'] }}
                    InputProps={{
                        style:
                            formik.touched.name && Boolean(formik.errors.name)
                                ? { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }
                                : { borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
                    }}
                />
                <TextField
                    disabled={formik.isSubmitting}
                    fullWidth
                    id="amount"
                    name="amount"
                    placeholder="amount *"
                    value={formik.values.amount}
                    onChange={formik.handleChange}
                    error={formik.touched.amount && Boolean(formik.errors.amount)}
                    helperText={formik.touched.amount && formik.errors.amount}
                    FormHelperTextProps={{ className: styles['form-helper-text'] }}
                    InputProps={{
                        style:
                            formik.touched.amount && Boolean(formik.errors.amount)
                                ? { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }
                                : { borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
                    }}
                />
                <Typography className={styles['form-help-caption']} variant="caption">
                    An external link can be provided so users can learn more about the NFT.
                </Typography>
                <TextField
                    disabled={formik.isSubmitting}
                    fullWidth
                    id="external_url"
                    name="external_url"
                    placeholder="external url"
                    value={formik.values.external_url}
                    onChange={formik.handleChange}
                    error={formik.touched.external_url && Boolean(formik.errors.external_url)}
                    helperText={formik.touched.external_url && formik.errors.external_url}
                    FormHelperTextProps={{ className: styles['form-helper-text'] }}
                    InputProps={{
                        style:
                            formik.touched.external_url && Boolean(formik.errors.external_url)
                                ? { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }
                                : { borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
                    }}
                />
                <TextField
                    disabled={formik.isSubmitting}
                    fullWidth
                    id="description"
                    name="description"
                    placeholder="description"
                    value={formik.values.description}
                    onChange={formik.handleChange}
                    error={formik.touched.description && Boolean(formik.errors.description)}
                    helperText={
                        formik.values.description.length === 255 ? formik.values.description.length + '/255' : null
                    }
                    FormHelperTextProps={{
                        style: { display: 'flex', justifyContent: 'flex-end' },
                    }}
                    InputProps={{
                        style:
                            formik.touched.description && Boolean(formik.errors.description)
                                ? { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }
                                : { borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
                    }}
                    rows={4}
                    multiline
                    inputProps={{ maxLength: 255 }}
                >
                    <Box
                        component="div"
                        sx={{ position: 'absolute', right: '0', bottom: '0', color: '#fff' }}
                    >{`'${formik.values.description.length} / 255'`}</Box>
                </TextField>
                <Typography className={styles['form-help-caption']} variant="caption">
                    A creator address or name can be added as an identity.
                </Typography>
                <TextField
                    disabled={formik.isSubmitting}
                    fullWidth
                    id="owner"
                    name="owner"
                    placeholder="creator id/name"
                    value={formik.values.owner}
                    onChange={formik.handleChange}
                    error={formik.touched.owner && Boolean(formik.errors.owner)}
                    helperText={formik.touched.owner && formik.errors.owner}
                    FormHelperTextProps={{ className: styles['form-helper-text'] }}
                    InputProps={{
                        style:
                            formik.touched.owner && Boolean(formik.errors.owner)
                                ? { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }
                                : { borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
                    }}
                />
                <Typography variant="caption" className={styles['form-help-caption']}>
                    Add a text file to your website (https) which holds a copy of the tokenid (obtained after creation)
                    and it can be used as validation.
                </Typography>
                <TextField
                    disabled={formik.isSubmitting}
                    fullWidth
                    id="webvalidate"
                    name="webvalidate"
                    placeholder="web validation url"
                    value={formik.values.webvalidate}
                    onChange={formik.handleChange}
                    error={formik.touched.webvalidate && Boolean(formik.errors.webvalidate)}
                    helperText={formik.touched.webvalidate && formik.errors.webvalidate}
                    FormHelperTextProps={{ className: styles['form-helper-text'] }}
                    InputProps={{
                        style:
                            formik.touched.webvalidate && Boolean(formik.errors.webvalidate)
                                ? { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }
                                : { borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
                    }}
                />
                <Button
                    disabled={formik.isSubmitting || !formik.isValid}
                    onClick={() => setModalEmployee('burn')}
                    variant="contained"
                    fullWidth
                    disableElevation
                >
                    {formik.isSubmitting ? 'Please wait...' : 'Mint'}
                </Button>
            </Stack>
            {/* closeFn, modal, title, children, formik  */}
            <ModalManager
                proceedFn={handleProceed} // move onto confirmation
                children={<NFTConfirmation formik={formik}></NFTConfirmation>}
                modal={modalEmployee}
                title="Confirmation"
                formik={formik}
                closeFn={handleClose}
            />

            <MiniModal
                open={open}
                handleClose={handleTransactionStatusModalClose}
                handleOpen={handleTransactionStatusModalOpen}
                header={modalStatus === 'Success' ? 'Success!' : modalStatus === 'Pending' ? 'Pending' : 'Failed!'}
                status="Transaction Status"
                subtitle={
                    modalStatus === 'Success' ? (
                        'Your transaction will be received shortly'
                    ) : modalStatus === 'Pending' ? (
                        <Pending />
                    ) : (
                        'Please try again later.'
                    )
                }
            />
        </form>
    );
};

const Required = () => {
    return <span className={styles['required']}>*</span>;
};

export default CreateNFTForm;
