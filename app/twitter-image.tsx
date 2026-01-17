import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Counsel of Grandmas - 5 AI grandmas ready to give you advice";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Ambient glow effects */}
        <div
          style={{
            position: "absolute",
            top: "-20%",
            left: "30%",
            width: "400px",
            height: "400px",
            background: "radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            right: "20%",
            width: "300px",
            height: "300px",
            background: "radial-gradient(circle, rgba(249, 115, 22, 0.2) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />

        {/* Grandma emojis */}
        <div
          style={{
            display: "flex",
            gap: "24px",
            marginBottom: "40px",
          }}
        >
          {["💬", "🌶️", "🌿", "⛪", "👑"].map((emoji, i) => (
            <div
              key={i}
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "40px",
                background: [
                  "linear-gradient(135deg, #a855f7, #7c3aed)",
                  "linear-gradient(135deg, #f97316, #ea580c)",
                  "linear-gradient(135deg, #10b981, #059669)",
                  "linear-gradient(135deg, #0ea5e9, #0284c7)",
                  "linear-gradient(135deg, #f59e0b, #d97706)",
                ][i],
                boxShadow: "0 0 40px rgba(255,255,255,0.1)",
              }}
            >
              {emoji}
            </div>
          ))}
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "72px",
            fontWeight: 700,
            color: "#ffffff",
            marginBottom: "16px",
            textShadow: "0 0 40px rgba(168, 85, 247, 0.5)",
          }}
        >
          Counsel of Grandmas
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: "28px",
            color: "#a1a1aa",
            marginBottom: "40px",
          }}
        >
          Always online • Always judging
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: "24px",
            color: "#71717a",
            maxWidth: "800px",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          5 AI grandmas with very different perspectives, ready to give you advice about life, love, and that thing you&apos;re definitely overthinking.
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
