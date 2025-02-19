import { configureStore, ThunkAction, Action, AnyAction } from "@reduxjs/toolkit";

import { BalanceState } from './slices/balanceSlice';
import { MiningState } from "./slices/miningSlice";
import { SendFormState } from './slices/app/sendSlice';
import { NotificationState } from './slices/notificationSlice';
import balanceReducer from './slices/balanceSlice';
import notificationReducer from './slices/notificationSlice';
import miningReducer from './slices/miningSlice';
import sendFormReducer from './slices/app/sendSlice';

export type RootState = {
    balance: BalanceState;
    notification: NotificationState;
    mining: MiningState;
    sendForm: SendFormState
};

export const store = configureStore({
    reducer: {
        balance: balanceReducer,
        notification: notificationReducer,
        mining: miningReducer,
        sendForm: sendFormReducer
    }
});

export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, AnyAction>;
