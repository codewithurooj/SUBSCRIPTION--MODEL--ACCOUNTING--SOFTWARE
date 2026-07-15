import { NextRequest, NextResponse } from "next/server";

// Render's free tier spins the backend down after inactivity; waking it
// back up can take 30-60s, longer than Vercel's default 10s function timeout.
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const backendResponse = await fetch(
    `${process.env.BACKEND_API_URL}/api/customers${request.nextUrl.search}`,
    { cache: "no-store" }
  );

  const data = await backendResponse.json().catch(() => ({}));
  return NextResponse.json(data, { status: backendResponse.status });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const backendResponse = await fetch(`${process.env.BACKEND_API_URL}/api/customers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await backendResponse.json().catch(() => ({}));
  return NextResponse.json(data, { status: backendResponse.status });
}
