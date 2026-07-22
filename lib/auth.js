const jwt = require("jsonwebtoken");
const { NextResponse } = require("next/server");

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function verifyAuth(request) {
  const header = request.headers.get("authorization");
  if (!header || !header.startsWith("Bearer ")) {
    return { user: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { user: decoded, response: null };
  } catch {
    return { user: null, response: NextResponse.json({ error: "Invalid or expired token" }, { status: 401 }) };
  }
}

module.exports = { signToken, verifyAuth };
