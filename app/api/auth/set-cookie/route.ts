import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { token } = await req.json();
  const res = NextResponse.json({ ok: true });
  res.cookies.set('5v_admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24,
    path: '/',
  });
  return res;
}
