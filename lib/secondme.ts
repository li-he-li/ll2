const SECONDME_CONFIG = {
  appId: process.env.SECONDME_APP_ID!,
  appSecret: process.env.SECONDME_APP_SECRET!,
  oauthEndpoint: process.env.SECONDME_OAUTH_ENDPOINT!,
  apiEndpoint: process.env.SECONDME_API_ENDPOINT!,
  // 官方文档: https://develop-docs.second.me/zh/docs/api-reference/oauth
  tokenEndpoint: "https://app.mindos.com/gate/lab/api/oauth/token/code",
  refreshEndpoint: "https://app.mindos.com/gate/lab/api/oauth/token/refresh",
  userInfoEndpoint: "https://app.mindos.com/gate/lab/api/secondme/user/info",
};

// 构建 x-www-form-urlencoded 请求体（SecondMe API 要求此格式）
function buildFormBody(data: Record<string, string>): string {
  return Object.keys(data)
    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
    .join('&');
}

export async function getAccessToken(code: string, redirectUri?: string) {
  const params: Record<string, string> = {
    grant_type: 'authorization_code',
    code,
    client_id: SECONDME_CONFIG.appId,
    client_secret: SECONDME_CONFIG.appSecret,
  };

  if (redirectUri) {
    params.redirect_uri = redirectUri;
  }

  const response = await fetch(SECONDME_CONFIG.tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: buildFormBody(params),
  });

  const result = await response.json();

  if (result.code !== 0) {
    throw new Error('获取访问令牌失败: ' + JSON.stringify(result));
  }

  // 响应字段为 camelCase: accessToken, refreshToken, expiresIn, tokenType, scope
  return result.data;
}

export async function getUserInfo(accessToken: string) {
  const response = await fetch(SECONDME_CONFIG.userInfoEndpoint, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  const result = await response.json();

  if (result.code !== 0) {
    throw new Error('获取用户信息失败: ' + JSON.stringify(result));
  }

  return result.data;
}

export async function refreshAccessToken(refreshToken: string) {
  const response = await fetch(SECONDME_CONFIG.refreshEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: buildFormBody({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: SECONDME_CONFIG.appId,
      client_secret: SECONDME_CONFIG.appSecret,
    }),
  });

  const result = await response.json();

  if (result.code !== 0) {
    throw new Error('刷新令牌失败: ' + JSON.stringify(result));
  }

  // 响应字段为 camelCase: accessToken, refreshToken, expiresIn, tokenType, scope
  return result.data;
}
