function getIp(req) {
  const forwarded = req.headers.get ? req.headers.get("x-forwarded-for") : req.headers["x-forwarded-for"];
  if (forwarded) {
    return String(forwarded).split(",")[0].trim();
  }
  return req.ip || "127.0.0.1";
}

function parseUserAgent(ua) {
  let browser;
  let os;
  let deviceType = "desktop";

  if (/Mobile|Android|iPhone|iPod/i.test(ua)) deviceType = "mobile";
  else if (/iPad|Tablet/i.test(ua)) deviceType = "tablet";

  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/Chrome\//.test(ua)) browser = "Chrome";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/Safari\//.test(ua)) browser = "Safari";

  if (/Windows/.test(ua)) os = "Windows";
  else if (/Mac OS X/.test(ua)) os = "macOS";
  else if (/Android/.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";
  else if (/Linux/.test(ua)) os = "Linux";

  return { browser, os, deviceType };
}

function captureDeviceInfo(req) {
  const userAgent = (req.headers.get ? req.headers.get("user-agent") : req.headers["user-agent"]) || "";
  const ipAddress = getIp(req);
  const parsed = userAgent ? parseUserAgent(userAgent) : {};
  return { ipAddress, userAgent, ...parsed };
}

module.exports = { captureDeviceInfo };
