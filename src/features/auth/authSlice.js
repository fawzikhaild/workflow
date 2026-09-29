
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  session: null,
  user: null,
  initialized: false,
};

const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {
    setSession(state, action) {
      const session = action.payload;

      state.session = session;
      state.user = session?.user ?? null;
      state.initialized = true;
    },

    clearSession(state) {
      state.session = null;
      state.user = null;
      state.initialized = true;
    },
  },
});

export const {
  setSession,
  clearSession,
} = authSlice.actions;

export default authSlice.reducer;

