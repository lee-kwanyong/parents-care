"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`
      }
    });

    setIsLoading(false);
    setMessage(error ? error.message : "로그인 링크를 이메일로 보냈습니다.");
  }

  return (
    <main className="hero">
      <section className="hero-card">
        <div className="kicker">로그인</div>
        <h1>이메일 매직링크로 시작</h1>
        <p>실서비스에서는 보호자 휴대폰 인증, 부모님 초대 링크, 운영실 관리자 권한을 분리합니다.</p>
      </section>
      <section className="panel">
        <form className="form" onSubmit={handleLogin}>
          <div className="field">
            <label htmlFor="email">이메일</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="care@example.com"
              required
            />
          </div>
          <button className="button" type="submit" disabled={isLoading}>
            {isLoading ? "보내는 중..." : "로그인 링크 받기"}
          </button>
          {message ? <p>{message}</p> : null}
        </form>
      </section>
    </main>
  );
}
