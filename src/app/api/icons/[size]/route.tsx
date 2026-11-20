import { ImageResponse } from "next/og";

export const runtime = "edge";

type Params = { params: Promise<{ size: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { size: sizeStr } = await params;
  const size = Math.min(Math.max(parseInt(sizeStr) || 192, 16), 1024);
  const radius = Math.round(size * 0.18);
  const iconScale = size / 192;

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          background: "linear-gradient(145deg, #1a9e7a, #168866)",
          borderRadius: radius,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Silhouette église */}
        <svg
          width={size * 0.6}
          height={size * 0.6}
          viewBox="0 0 28 28"
          fill="none"
        >
          {/* Nef */}
          <path
            d="M4 25V11L14 4L24 11V25H17V17H11V25H4Z"
            fill="white"
            fillOpacity="0.95"
          />
          {/* Croix */}
          <rect x="13" y="1" width="2" height="6" fill="white" fillOpacity="0.9" />
          <rect x="11" y="2.5" width="6" height="2" fill="white" fillOpacity="0.9" />
        </svg>
      </div>
    ),
    { width: size, height: size }
  );
}
