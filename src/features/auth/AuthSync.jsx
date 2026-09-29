
import { useEffect } from "react";
import { useDispatch } from "react-redux";

import { supabase } from "@/lib/supabaseClient";
import {
  clearSession,
  setSession,
} from "./authSlice";

export default function AuthSync({
  children,
}) {
  const dispatch = useDispatch();

  useEffect(() => {
    let mounted = true;

    async function loadInitialSession() {
      const {
        data,
        error,
      } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      if (error) {
        console.error(
          "Initial auth session error:",
          error
        );

        dispatch(clearSession());
        return;
      }

      dispatch(setSession(data.session));
    }

    loadInitialSession();

    const {
      data: {
        subscription,
      },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        dispatch(setSession(session));
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [dispatch]);

  return children;
}
