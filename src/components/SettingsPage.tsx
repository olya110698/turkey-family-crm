import { useState } from "react";
import { Cloud, LogIn, LogOut } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { supabase, supabaseEnabled } from "../lib-supabase";

interface Props {
  session: Session | null;
  notify: (s: string) => void;
}

export function SettingsPage({ session, notify }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const signIn = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    error ? notify(error.message) : notify("Вход выполнен");
  };
  const signOut = async () => {
    await supabase?.auth.signOut();
    notify("Вы вышли");
  };
  return (
    <section className="card form-card">
      <span className="eyebrow">Облако</span>
      <h2>Синхронизация и вход</h2>
      {!supabaseEnabled ? (
        <div className="notice">
          <Cloud />
          <div>
            <strong>Supabase ещё не подключён</strong>
            <p>
              Добавьте VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в Vercel.
              Инструкция и SQL лежат в проекте.
            </p>
          </div>
        </div>
      ) : session ? (
        <>
          <div className="notice success">
            <Cloud />
            <div>
              <strong>Вход выполнен</strong>
              <p>{session.user.email}</p>
            </div>
          </div>
          <button className="secondary" onClick={signOut}>
            <LogOut size={18} /> Выйти
          </button>
        </>
      ) : (
        <>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Пароль
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button className="primary" onClick={signIn}>
            <LogIn size={18} /> Войти
          </button>
        </>
      )}
    </section>
  );
}
