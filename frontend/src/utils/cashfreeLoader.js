/**
 * Dynamic loader for Cashfree Payments JS SDK v3
 * Official script: https://sdk.cashfree.com/js/v3/cashfree.js
 */

let cashfreePromise = null;

export const loadCashfreeSDK = () => {
  if (typeof window === 'undefined') return Promise.reject(new Error('Window not available'));

  if (window.Cashfree) {
    return Promise.resolve(window.Cashfree);
  }

  if (cashfreePromise) {
    return cashfreePromise;
  }

  cashfreePromise = new Promise((resolve, reject) => {
    // Check if script already injected
    const existingScript = document.querySelector('script[src="https://sdk.cashfree.com/js/v3/cashfree.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.Cashfree));
      existingScript.addEventListener('error', (err) => reject(err));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    script.onload = () => {
      if (window.Cashfree) {
        resolve(window.Cashfree);
      } else {
        reject(new Error('Cashfree object unavailable after script load'));
      }
    };
    script.onerror = () => {
      reject(new Error('Failed to load Cashfree JS SDK script'));
    };

    document.head.appendChild(script);
  });

  return cashfreePromise;
};
