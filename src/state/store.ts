/* eslint-disable */
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./features/authSlice.js";
import fileReducer from "./features/fileSlice.ts";
import globalReducer from "./features/globalSlice.js";
import notificationsReducer from "./features/notificationsSlice.js";

export const store = configureStore({
  reducer: {
    notifications: notificationsReducer,
    auth: authReducer,
    global: globalReducer,
    file: fileReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
  preloadedState: undefined, // optional, can be any valid state object
});

// Define the RootState type, which is the type of the entire Redux state tree.
// This is useful when you need to access the state in a component or elsewhere.
export type RootState = ReturnType<typeof store.getState>;

// Define the AppDispatch type, which is the type of the Redux store's dispatch function.
// This is useful when you need to dispatch an action in a component or elsewhere.
export type AppDispatch = typeof store.dispatch;
