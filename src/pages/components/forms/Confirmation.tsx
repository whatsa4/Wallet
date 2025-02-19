/**
 *
 * Confirmation screen for all transaction forms
 *
 */
import { Modal, Box, Typography, Stack, Button, Toolbar } from '@mui/material';
import { ModalButtonWrapper } from '../../../shared/components/modals/ModalWrappers';
import styles from '../../../theme/cssmodule/Components.module.css';

const Confirmation = ({ title, children, closeFn, open, formik, modalTitle }: any) => {
    return (
        <Modal open={open} onClose={closeFn} onBackdropClick={closeFn} className={styles['burn-modal-wrapper']}>
            <Box className={styles['burn-modal']}>
                <Box component="div">
                    <Toolbar sx={{ pl: '16px!important' }} variant="dense" className={styles['burn-modal-hdr']}>
                        <Typography aria-label="modal-title" className={styles['burn-modal-title']} variant="h6">
                            {modalTitle && modalTitle.length ? modalTitle : 'Confirmation'}
                        </Typography>
                    </Toolbar>
                    <Stack direction="column" sx={{ padding: '8px 16px' }}>
                        {children}
                    </Stack>
                </Box>

                <ModalButtonWrapper
                    children={
                        <>
                            <Button disabled={formik.isSubmitting} variant="outlined" color="inherit" onClick={closeFn}>
                                Cancel
                            </Button>
                            <Button
                                disabled={formik.isSubmitting}
                                variant="contained"
                                disableElevation
                                color="primary"
                                className={styles['burn-skip-btn']}
                                onClick={() => formik.handleSubmit()}
                            >
                                {formik.isSubmitting ? 'Please wait...' : 'Accept'}
                            </Button>
                        </>
                    }
                />
            </Box>
        </Modal>
    );
};

export default Confirmation;
