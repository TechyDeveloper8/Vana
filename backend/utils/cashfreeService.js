/**
 * Cashfree Payment Gateway Service Utility
 * Official Cashfree PG API (v2023-08-01) integration
 * Dual-environment auto-detection (Production & Sandbox) with real-time checkout sessions
 * Documentation: https://docs.cashfree.com/reference/pg-new-apis-endpoint
 */

const cleanStr = (val) => {
  if (!val || typeof val !== 'string') return '';
  return val.replace(/^["']|["']$/g, '').trim();
};

const getCashfreeConfig = () => {
  const appId = cleanStr(process.env.CASHFREE_APP_ID || '1390076f72edc0a19549a7355bb6700931');
  const secretKey = cleanStr(process.env.CASHFREE_SECRET_KEY || '');
  const explicitEnv = cleanStr(process.env.CASHFREE_ENV).toLowerCase();
  const apiVersion = cleanStr(process.env.CASHFREE_API_VERSION) || '2023-08-01';

  // In Cashfree, Sandbox app IDs often start with TEST or credentials are labeled test
  const defaultEnv = (appId.toUpperCase().startsWith('TEST') || secretKey.toLowerCase().includes('test'))
    ? 'sandbox'
    : 'production';
  const preferredEnv = explicitEnv === 'sandbox' || explicitEnv === 'production'
    ? explicitEnv
    : defaultEnv;

  const prodUrl = 'https://api.cashfree.com/pg';
  const sandboxUrl = 'https://sandbox.cashfree.com/pg';

  const isConfigured = Boolean(
    appId &&
    secretKey &&
    !appId.includes('TEST_SAMPLE') &&
    !secretKey.includes('TEST_SAMPLE')
  );

  return { appId, secretKey, preferredEnv, apiVersion, prodUrl, sandboxUrl, isConfigured };
};

// In-memory cache of verified working environment to avoid unnecessary retry latency
let cachedWorkingEnv = null;

/**
 * Execute HTTP request to Cashfree PG with dual-environment auto-detection
 * Tries the preferred/cached environment first; if authentication fails (HTTP 401),
 * automatically retries on the alternate environment (Production <-> Sandbox).
 */
const executeCashfreeRequest = async (path, options = {}) => {
  const config = getCashfreeConfig();
  const primaryEnv = cachedWorkingEnv || config.preferredEnv;
  const secondaryEnv = primaryEnv === 'production' ? 'sandbox' : 'production';

  const getUrl = (env) => (env === 'production' ? config.prodUrl : config.sandboxUrl) + path;
  const getHeaders = () => ({
    'x-client-id': config.appId,
    'x-client-secret': config.secretKey,
    'x-api-version': config.apiVersion,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers || {})
  });

  const sendReq = async (env) => {
    const url = getUrl(env);
    const res = await fetch(url, {
      ...options,
      headers: getHeaders()
    });
    let data = null;
    try {
      data = await res.json();
    } catch {
      data = { message: `Non-JSON response from Cashfree ${env}` };
    }
    return { res, data, env };
  };

  // 1. Try Primary Environment
  const primaryResult = await sendReq(primaryEnv);

  const isAuthError = (result) => {
    if (result.res.status === 401) return true;
    const msg = (result.data?.message || '').toLowerCase();
    const type = (result.data?.type || '').toLowerCase();
    return msg.includes('authentication') || type.includes('authentication') || type.includes('invalid_client');
  };

  // If primary succeeded or returned a functional error other than 401 auth failure, return it
  if (!isAuthError(primaryResult)) {
    if (primaryResult.res.ok) {
      cachedWorkingEnv = primaryEnv;
    }
    return primaryResult;
  }

  // 2. Primary failed with Authentication Error -> Try Secondary Environment
  console.warn(`[CASHFREE SERVICE] Authentication failed on ${primaryEnv} (${primaryResult.data?.message}). Automatically attempting alternate endpoint: ${secondaryEnv}...`);

  const secondaryResult = await sendReq(secondaryEnv);

  if (!isAuthError(secondaryResult)) {
    console.log(`[CASHFREE SERVICE] Successfully authenticated on alternate Cashfree endpoint: ${secondaryEnv}`);
    cachedWorkingEnv = secondaryEnv;
    return secondaryResult;
  }

  // 3. Both endpoints failed authentication
  console.error('[CASHFREE SERVICE] Cashfree authentication failed on both Production and Sandbox endpoints. Please check CASHFREE_APP_ID and CASHFREE_SECRET_KEY.');
  return {
    ...secondaryResult,
    bothAuthFailed: true,
    primaryResult
  };
};

/**
 * Creates a Cashfree Order & Payment Session for Real-Time Checkout
 * @param {Object} params - { orderId, orderAmount, customerId, customerName, customerEmail, customerPhone, returnUrl }
 * @returns {Promise<Object>}
 */
exports.createCashfreeOrder = async (params) => {
  const {
    orderId,
    orderAmount,
    customerId = 'cust_' + Date.now(),
    customerName = 'Guest Attendee',
    customerEmail = 'guest@example.com',
    customerPhone = '9876543210',
    returnUrl
  } = params;

  const config = getCashfreeConfig();

  if (!config.isConfigured) {
    console.error('[CASHFREE SERVICE] Missing credentials. CASHFREE_APP_ID and CASHFREE_SECRET_KEY must be configured.');
    return {
      success: false,
      error: 'Cashfree API credentials are not configured on the server. Please set CASHFREE_APP_ID and CASHFREE_SECRET_KEY.'
    };
  }

  // Clean phone number (Cashfree requires exactly 10 digits for Indian numbers)
  let rawDigits = String(customerPhone || '').replace(/\D/g, '');
  if (rawDigits.startsWith('91') && rawDigits.length === 12) {
    rawDigits = rawDigits.slice(2);
  } else if (rawDigits.length > 10) {
    rawDigits = rawDigits.slice(-10);
  } else if (rawDigits.length < 10) {
    // Pad or fallback to valid standard demo mobile if less than 10 digits
    rawDigits = rawDigits ? rawDigits.padEnd(10, '0') : '9876543210';
  }
  const cleanPhone = rawDigits;
  const formattedAmount = Number(Number(orderAmount).toFixed(2));

  // Determine return URL — Cashfree Production strictly requires https://
  let finalReturnUrl = returnUrl;
  if (!finalReturnUrl) {
    finalReturnUrl = `https://www.vanaentertainments.com/book-ticket?order_id=${orderId}`;
  } else if (!finalReturnUrl.includes('order_id=')) {
    finalReturnUrl = finalReturnUrl.includes('?')
      ? `${finalReturnUrl}&order_id=${orderId}`
      : `${finalReturnUrl}?order_id=${orderId}`;
  }
  // Cashfree Production rejects http:// URLs — swap to https:// for localhost dev
  if (finalReturnUrl.startsWith('http://')) {
    finalReturnUrl = `https://www.vanaentertainments.com/book-ticket?order_id=${orderId}`;
  }

  try {
    const payload = {
      order_id: orderId,
      order_amount: formattedAmount,
      order_currency: 'INR',
      customer_details: {
        customer_id: String(customerId).substring(0, 50),
        customer_name: String(customerName).substring(0, 100),
        customer_email: String(customerEmail).substring(0, 100),
        customer_phone: cleanPhone
      },
      order_meta: {
        return_url: finalReturnUrl
      },
      order_note: `Vana Ticket Reservation - ${orderId}`
    };

    const { res, data, env, bothAuthFailed } = await executeCashfreeRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (bothAuthFailed) {
      return {
        success: false,
        error: 'Cashfree authentication failed on both Production and Sandbox endpoints. Please verify CASHFREE_APP_ID and CASHFREE_SECRET_KEY in Render environment settings.',
        code: 'AUTHENTICATION_FAILED',
        env
      };
    }

    if (!res.ok) {
      console.warn('[CASHFREE PG ERROR RESPONSE]:', data);
      return {
        success: false,
        error: data.message || 'Failed to create Cashfree payment order.',
        code: data.code || 'PG_ERROR',
        env
      };
    }

    return {
      success: true,
      order_id: data.order_id,
      cf_order_id: data.cf_order_id,
      payment_session_id: data.payment_session_id,
      order_status: data.order_status,
      order_amount: data.order_amount,
      order_currency: data.order_currency,
      env
    };
  } catch (err) {
    console.error('[CASHFREE ORDER CREATION EXCEPTION]:', err);
    return {
      success: false,
      error: err.message || 'Cashfree service network exception',
      code: 'NETWORK_ERROR'
    };
  }
};

/**
 * Verifies Cashfree Order Status & Payment details with Cashfree PG
 * @param {string} orderId - Cashfree Order ID
 * @returns {Promise<Object>}
 */
exports.verifyCashfreeOrder = async (orderId) => {
  const config = getCashfreeConfig();

  if (!config.isConfigured) {
    return {
      success: false,
      isPaid: false,
      message: 'Cashfree credentials not configured.'
    };
  }

  try {
    const { res, data: orderData, env, bothAuthFailed } = await executeCashfreeRequest(
      `/orders/${encodeURIComponent(orderId)}`,
      { method: 'GET' }
    );

    if (bothAuthFailed || !res.ok) {
      console.warn('[CASHFREE VERIFY ORDER ERROR]:', orderData);
      return {
        success: false,
        isPaid: false,
        message: orderData?.message || `Failed to verify Cashfree order (status: ${res.status})`
      };
    }

    let isPaid = orderData.order_status === 'PAID';
    let paymentDetails = null;

    // Check payment attempts directly from Cashfree payments endpoint
    try {
      const baseUrl = env === 'production' ? config.prodUrl : config.sandboxUrl;
      const payRes = await fetch(`${baseUrl}/orders/${encodeURIComponent(orderId)}/payments`, {
        method: 'GET',
        headers: {
          'x-client-id': config.appId,
          'x-client-secret': config.secretKey,
          'x-api-version': config.apiVersion,
          'Accept': 'application/json'
        }
      });
      if (payRes.ok) {
        const payments = await payRes.json();
        if (Array.isArray(payments) && payments.length > 0) {
          paymentDetails = payments.find(p => p.payment_status === 'SUCCESS') || payments[0];
          if (paymentDetails && paymentDetails.payment_status === 'SUCCESS') {
            isPaid = true;
          }
        }
      }
    } catch (payErr) {
      console.warn('[CASHFREE FETCH PAYMENTS WARNING]:', payErr.message);
    }

    // If order is ACTIVE but not yet confirmed PAID, wait 1.5s and retry once (handles banking webhook propagation)
    if (!isPaid && orderData.order_status === 'ACTIVE') {
      await new Promise(r => setTimeout(r, 1500));
      try {
        const baseUrl = env === 'production' ? config.prodUrl : config.sandboxUrl;
        const retryRes = await fetch(`${baseUrl}/orders/${encodeURIComponent(orderId)}`, {
          method: 'GET',
          headers: {
            'x-client-id': config.appId,
            'x-client-secret': config.secretKey,
            'x-api-version': config.apiVersion,
            'Accept': 'application/json'
          }
        });
        if (retryRes.ok) {
          const retryData = await retryRes.json();
          if (retryData.order_status === 'PAID') {
            isPaid = true;
            Object.assign(orderData, retryData);
          }
        }
      } catch (retryErr) {
        console.warn('[CASHFREE RETRY ERROR]:', retryErr.message);
      }
    }

    if (!isPaid) {
      return {
        success: false,
        isPaid: false,
        order_status: orderData.order_status,
        message: `Payment is not completed yet (status: ${orderData.order_status}). If your payment was just deducted, please wait 3 seconds and click 'Verify Payment'.`
      };
    }

    return {
      success: true,
      isPaid: true,
      order_status: orderData.order_status,
      order_amount: orderData.order_amount,
      cf_payment_id: paymentDetails?.cf_payment_id || orderData.cf_order_id,
      payment_method: paymentDetails?.payment_group || paymentDetails?.payment_method || 'Cashfree PG',
      data: orderData
    };
  } catch (err) {
    console.error('[CASHFREE VERIFY EXCEPTION]:', err);
    return {
      success: false,
      isPaid: false,
      message: err.message
    };
  }
};

/**
 * Diagnostic helper to test credentials against Cashfree Production and Sandbox
 * Safe non-destructive probe (GET /orders/probe_connection_test)
 */
exports.testCashfreeConnection = async () => {
  const config = getCashfreeConfig();

  if (!config.isConfigured) {
    return {
      configured: false,
      appIdPresent: Boolean(config.appId),
      appIdPrefix: config.appId ? config.appId.substring(0, 8) + '...' : null,
      secretKeyPresent: Boolean(config.secretKey),
      preferredEnv: config.preferredEnv,
      message: 'CASHFREE_APP_ID and/or CASHFREE_SECRET_KEY are not set in environment variables.'
    };
  }

  const probe = async (url) => {
    try {
      const res = await fetch(`${url}/orders/probe_test_${Date.now()}`, {
        method: 'GET',
        headers: {
          'x-client-id': config.appId,
          'x-client-secret': config.secretKey,
          'x-api-version': config.apiVersion,
          'Accept': 'application/json'
        }
      });
      const data = await res.json().catch(() => ({}));
      // Status 404 (order not found) means authentication was successful!
      // Status 401 means authentication failed.
      const authenticated = res.status !== 401;
      return { status: res.status, authenticated, message: data.message || res.statusText };
    } catch (err) {
      return { status: 0, authenticated: false, message: err.message };
    }
  };

  const [prodProbe, sandboxProbe] = await Promise.all([
    probe(config.prodUrl),
    probe(config.sandboxUrl)
  ]);

  let workingEnv = null;
  if (prodProbe.authenticated) workingEnv = 'production';
  else if (sandboxProbe.authenticated) workingEnv = 'sandbox';

  if (workingEnv) {
    cachedWorkingEnv = workingEnv;
  }

  return {
    configured: true,
    appIdPrefix: config.appId ? config.appId.substring(0, 8) + '...' : null,
    secretKeyPresent: Boolean(config.secretKey),
    secretKeyLength: config.secretKey ? config.secretKey.length : 0,
    preferredEnv: config.preferredEnv,
    cachedWorkingEnv,
    workingEnv,
    production: prodProbe,
    sandbox: sandboxProbe,
    recommendation: workingEnv
      ? `Cashfree is working in ${workingEnv.toUpperCase()} mode.`
      : 'Authentication failed on both endpoints. Ensure CASHFREE_APP_ID and CASHFREE_SECRET_KEY are exact matches from the Cashfree Dashboard (Production or Sandbox).'
  };
};
