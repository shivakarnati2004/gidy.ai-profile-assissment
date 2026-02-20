import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { completeSignup, loginWithPassword, requestOtp, verifyOtpForSignup } from "@/lib/api";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [mode, setMode] = useState<"login" | "create">("login");
  const [createStep, setCreateStep] = useState<"request" | "verify" | "password">("request");
  const [signupToken, setSignupToken] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const modeParam = searchParams.get("mode");
    if (modeParam === "create") {
      setMode("create");
    }
  }, [searchParams]);

  const switchMode = (nextMode: "login" | "create") => {
    setMode(nextMode);
    setStatus("idle");
    setMessage(null);
    setCode("");
    setPassword("");
    setConfirmPassword("");
    setSignupToken("");
    setCreateStep("request");

    if (nextMode === "create") {
      setSearchParams({ mode: "create" });
    } else {
      setSearchParams({});
    }
  };

  const handleRequestOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("loading");
    setMessage(null);

    try {
      const data = await requestOtp(email);
      if (data.signupToken) {
        setSignupToken(data.signupToken);
        setUsername(data.signup?.username ?? "");
        setCreateStep("password");
        setStatus("success");
        setMessage("OTP verification is bypassed in this environment. Set your password to finish account creation.");
        return;
      }

      setCreateStep("verify");
      setStatus("success");
      setMessage("OTP sent. Check your email.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to send OTP");
    }
  };

  const handleVerifyOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("loading");
    setMessage(null);

    try {
      const data = await verifyOtpForSignup(email, code);
      setSignupToken(data.signupToken);
      setUsername(data.signup.username ?? "");
      setCreateStep("password");
      setStatus("success");
      setMessage("OTP verified. Set your password to finish account creation.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to verify OTP");
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("loading");
    setMessage(null);

    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match");
      return;
    }

    try {
      await completeSignup(signupToken, password, username || undefined);
      setStatus("success");
      navigate("/profile");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to create account");
    }
  };

  const handleLoginSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("loading");
    setMessage(null);

    try {
      await loginWithPassword(email, password);
      setStatus("success");
      navigate("/profile");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to sign in");
    }
  };

  const renderCreateAccountForm = () => {
    if (createStep === "password") {
      return (
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username (optional)</Label>
            <Input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="your-handle"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimum 8 characters"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Re-enter password"
              required
            />
          </div>

          {message && (
            <p className={`text-sm ${status === "error" ? "text-destructive" : "text-muted-foreground"}`}>
              {message}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={status === "loading"}>
            {status === "loading" ? "Please wait..." : "Create account"}
          </Button>
        </form>
      );
    }

    return (
      <form onSubmit={createStep === "request" ? handleRequestOtp : handleVerifyOtp} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="createEmail">Email</Label>
          <Input
            id="createEmail"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            disabled={status === "loading" || createStep !== "request"}
          />
        </div>

        {createStep === "verify" && (
          <div className="space-y-2">
            <Label htmlFor="code">OTP Code</Label>
            <Input
              id="code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Enter the 6-digit code"
              required
            />
          </div>
        )}

        {message && (
          <p className={`text-sm ${status === "error" ? "text-destructive" : "text-muted-foreground"}`}>
            {message}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={status === "loading"}>
          {status === "loading"
            ? "Please wait..."
            : createStep === "request"
            ? "Send OTP"
            : "Verify OTP"}
        </Button>
      </form>
    );
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{mode === "login" ? "Sign in" : "Create account"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === "login" ? "default" : "outline"}
              className="flex-1"
              onClick={() => switchMode("login")}
            >
              Login
            </Button>
            <Button
              type="button"
              variant={mode === "create" ? "default" : "outline"}
              className="flex-1"
              onClick={() => switchMode("create")}
            >
              Create Account
            </Button>
          </div>

          {mode === "login" ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Your password"
                  required
                />
              </div>

              {message && (
                <p className={`text-sm ${status === "error" ? "text-destructive" : "text-muted-foreground"}`}>
                  {message}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={status === "loading"}>
                {status === "loading" ? "Please wait..." : "Login"}
              </Button>
            </form>
          ) : (
            renderCreateAccountForm()
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
