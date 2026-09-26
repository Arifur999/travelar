import { NextResponse } from "next/server";
import { httpClient } from "@/lib/axios/httpClient";

/**
 * The bKash QR, fetched from the API and handed to the browser.
 *
 * An <img> cannot point at the API directly: only the payment gateway's
 * callback is proxied to it from the internet, and everything else reaches it
 * server-side from this app. So the image comes through here, with the
 * viewer's own cookies, which means the API still decides who may see it.
 *
 * Dynamic because it reads those cookies — a cached copy would be one
 * agency's request answered for everyone.
 */
export const dynamic = "force-dynamic";

export const GET = async () => {
  try {
    const file = await httpClient.getFile("/billing/manual-payment/qr");

    return new NextResponse(Buffer.from(file.data), {
      headers: {
        "Content-Type": file.contentType,
        // Short and private: the QR changes when the operator replaces it, and
        // nobody should be holding a stale one for long.
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch {
    // No QR set yet, or the viewer may not have one. Either way there is no
    // image to send, and an <img> that 404s degrades to its alt text.
    return new NextResponse(null, { status: 404 });
  }
};
