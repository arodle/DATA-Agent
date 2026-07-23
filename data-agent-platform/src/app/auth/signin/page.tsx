"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") || "/user/workspace";
  const initialError = searchParams.get("error") ? "邮箱或密码错误" : "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState(initialError);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signup") {
        if (!name.trim()) {
          setError("请输入姓名");
          return;
        }
        if (!email.trim() || !email.includes("@")) {
          setError("请输入有效的邮箱");
          return;
        }
        if (password.length < 6) {
          setError("密码至少 6 位");
          return;
        }

        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "注册失败");
          return;
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError(mode === "signup" ? "注册成功但登录失败" : "邮箱或密码错误");
      } else {
        router.push(callbackUrl);
      }
    } catch {
      setError(mode === "signup" ? "注册失败，请重试" : "登录失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authPage">
      <div className="authCard">
        <div className="authLogo">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <rect width="48" height="48" rx="14" fill="#0d1117" />
            <rect width="48" height="48" rx="14" stroke="#60a5fa" strokeWidth="1.5" />
            <circle cx="18" cy="22" r="4" fill="#60a5fa" />
            <circle cx="30" cy="22" r="4" fill="#60a5fa" />
            <path d="M14 32 Q24 38 34 32" stroke="#60a5fa" strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="authTitle">{mode === "signin" ? "登录" : "注册"}</h1>
        <p className="authSubtitle">欢迎使用数据代理平台</p>

        {error && <div className="authError">{error}</div>}

        <form onSubmit={handleSubmit} className="authForm">
          {mode === "signup" && (
            <div className="authField">
              <label className="authLabel">姓名</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="请输入姓名" className="authInput" />
            </div>
          )}
          <div className="authField">
            <label className="authLabel">邮箱</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="请输入邮箱" className="authInput" />
          </div>
          <div className="authField">
            <label className="authLabel">密码</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="请输入密码" className="authInput" />
          </div>
          <button type="submit" disabled={loading} className="authBtn">
            {loading ? "处理中..." : mode === "signin" ? "登录" : "注册"}
          </button>
        </form>

        <div className="authSwitch">
          {mode === "signin" ? (
            <>
              还没有账号？{" "}
              <button type="button" onClick={() => setMode("signup")} className="authLink">立即注册</button>
            </>
          ) : (
            <>
              已有账号？{" "}
              <button type="button" onClick={() => setMode("signin")} className="authLink">立即登录</button>
            </>
          )}
        </div>

        <div className="authDemo">
          <div className="authDemoLabel">演示账号</div>
          <div className="authDemoRow">
            <span className="authDemoText">lin@example.com</span>
            <span className="authDemoText">123456</span>
          </div>
        </div>
      </div>
    </div>
  );
}
