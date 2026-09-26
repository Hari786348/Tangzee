"use client";
import { useState, useRef } from "react";
import { useParams } from "next/navigation";

const PLUM = "#2F243A";
const CANVAS_SIZE = 320;

export default function CampaignPage() {
  const { code } = useParams();
  const [email, setEmail] = useState("");
  const [otpStage, setOtpStage] = useState("enter-email"); // enter-email | enter-code | verified
  const [otpCode, setOtpCode] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | claimed | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Photo + circle step — purely for fun/engagement. Nothing here is
  // ever uploaded, saved, or checked — it never leaves the browser.
  const [photoReady, setPhotoReady] = useState(false);
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);

  function handlePhotoSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      const scale = Math.min(CANVAS_SIZE / img.width, CANVAS_SIZE / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (CANVAS_SIZE - w) / 2, (CANVAS_SIZE - h) / 2, w, h);
      setPhotoReady(true);
    };
    img.src = URL.createObjectURL(file);
  }

  function pointerPos(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function startDraw(e) {
    drawingRef.current = true;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { x, y } = pointerPos(e, canvas);
    ctx.strokeStyle = "#D8B36A";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function moveDraw(e) {
    if (!drawingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { x, y } = pointerPos(e, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function endDraw() {
    drawingRef.current = false;
  }

  function retakePhoto() {
    setPhotoReady(false);
    const canvas = canvasRef.current;
    canvas?.getContext("2d").clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  }

  async function sendOtp() {
    setErrorMsg("");
    setStatus("loading");
    const res = await fetch("/api/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setStatus("idle");
    if (!res.ok) {
      setErrorMsg(data.error || "Couldn't send the code. Check the email and try again.");
      return;
    }
    setOtpStage("enter-code");
  }

  async function verifyOtp() {
    setErrorMsg("");
    setStatus("loading");
    const res = await fetch("/api/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code: otpCode }),
    });
    const data = await res.json();
    setStatus("idle");
    if (!res.ok) {
      setErrorMsg(data.error === "INVALID_CODE" ? "That code isn't right — try again." : data.error);
      return;
    }
    setOtpStage("verified");
  }

  async function handleClaim() {
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/campaign/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, campaignCode: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(humanizeError(data.error));
        setStatus("error");
        return;
      }
      setResult(data.claim);
      setStatus("claimed");
    } catch (e) {
      setErrorMsg("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: PLUM, color: "#FFFFFF", padding: "32px 20px" }}>
      <div style={{ maxWidth: 420, margin: "0 auto", textAlign: "center" }}>
        <h1 style={{ fontSize: 28, letterSpacing: 2, marginBottom: 4 }}>TANGZEE</h1>
        <h2 style={{ fontWeight: 400, opacity: 0.9, marginTop: 0 }}>ONLY 1 DIFFERENCE</h2>
        <p style={{ letterSpacing: 1, opacity: 0.8 }}>FIND IT. CIRCLE IT. BRING IT.</p>

        {status !== "claimed" && otpStage === "enter-email" && (
          <div style={{ marginTop: 32 }}>
            <p style={{ fontSize: 18, marginBottom: 16 }}>FOUND THE DIFFERENCE?</p>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />
            <button onClick={sendOtp} disabled={status === "loading" || !email} style={buttonStyle}>
              {status === "loading" ? "SENDING…" : "SEND CODE"}
            </button>
            {errorMsg && <p style={errorStyle}>{errorMsg}</p>}
          </div>
        )}

        {status !== "claimed" && otpStage === "enter-code" && (
          <div style={{ marginTop: 32 }}>
            <p style={{ fontSize: 15, marginBottom: 16 }}>Enter the code we emailed to {email}</p>
            <input
              type="text"
              placeholder="6-digit code"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              style={inputStyle}
            />
            <button onClick={verifyOtp} disabled={status === "loading" || !otpCode} style={buttonStyle}>
              {status === "loading" ? "VERIFYING…" : "VERIFY"}
            </button>
            {errorMsg && <p style={errorStyle}>{errorMsg}</p>}
          </div>
        )}

        {status !== "claimed" && otpStage === "verified" && !photoReady && (
          <div style={{ marginTop: 32 }}>
            <p style={{ fontSize: 15, marginBottom: 16 }}>Take a photo of the poster you found</p>
            <label style={{ ...buttonStyle, display: "block", cursor: "pointer" }}>
              TAKE / CHOOSE PHOTO
              <input type="file" accept="image/*" capture="environment" onChange={handlePhotoSelect} style={{ display: "none" }} />
            </label>
          </div>
        )}

        {status !== "claimed" && otpStage === "verified" && photoReady && (
          <div style={{ marginTop: 24 }}>
            <p style={{ fontSize: 15, marginBottom: 12 }}>Circle the difference you found</p>
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              style={{ width: CANVAS_SIZE, height: CANVAS_SIZE, borderRadius: 8, border: "1px solid #FFFFFF44", touchAction: "none", background: "#00000022" }}
              onPointerDown={startDraw}
              onPointerMove={moveDraw}
              onPointerUp={endDraw}
              onPointerLeave={endDraw}
            />
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <button onClick={retakePhoto} style={{ ...buttonStyle, marginTop: 0, background: "transparent", color: "#fff", border: "1px solid #FFFFFF66" }}>
                RETAKE
              </button>
              <button onClick={handleClaim} disabled={status === "loading"} style={{ ...buttonStyle, marginTop: 0 }}>
                {status === "loading" ? "CLAIMING..." : "SUBMIT & CLAIM"}
              </button>
            </div>
            {status === "error" && <p style={errorStyle}>{errorMsg}</p>}
          </div>
        )}

        {status === "claimed" && result && (
          <div style={{ marginTop: 32, border: "1px solid #FFFFFF44", borderRadius: 10, padding: 24 }}>
            <p style={{ letterSpacing: 1, opacity: 0.8 }}>YOUR TANGZEE EXTRA</p>
            <p style={{ fontSize: 20, margin: "8px 0" }}>2 FOR THE PRICE OF 1</p>
            <p style={{ fontSize: 13, opacity: 0.7, marginTop: 20 }}>CLAIM CODE</p>
            <p style={{ fontSize: 24, letterSpacing: 2, fontWeight: 700 }}>{result.claim_code}</p>
            <p style={{ marginTop: 16, fontSize: 13, opacity: 0.8 }}>SHOW THIS AT TANGZEE.</p>
            <p style={{ marginTop: 8, fontSize: 12, opacity: 0.6 }}>Status: {result.status}</p>
          </div>
        )}
      </div>
    </main>
  );
}

function humanizeError(code) {
  const map = {
    ALREADY_CLAIMED: "You've already claimed this campaign.",
    CAMPAIGN_NOT_ACTIVE: "This campaign isn't active right now.",
    CAMPAIGN_EXPIRED: "This campaign has ended.",
    CAMPAIGN_NOT_STARTED: "This campaign hasn't started yet.",
    CAMPAIGN_NOT_FOUND: "We couldn't find that campaign.",
    EMAIL_NOT_VERIFIED: "Please verify your email again.",
  };
  return map[code] || "Something went wrong. Please try again.";
}

const inputStyle = {
  width: "100%",
  padding: 14,
  borderRadius: 6,
  border: "1px solid #FFFFFF66",
  background: "transparent",
  color: "#FFFFFF",
  fontSize: 16,
  boxSizing: "border-box",
};
const buttonStyle = {
  marginTop: 16,
  width: "100%",
  padding: 14,
  borderRadius: 6,
  border: "none",
  background: "#FFFFFF",
  color: PLUM,
  fontWeight: 600,
  letterSpacing: 1,
  fontSize: 16,
};
const errorStyle = { color: "#FFB4B4", marginTop: 12 };
