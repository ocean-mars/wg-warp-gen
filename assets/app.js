const CORS_PROXY = 'https://proxy.cors.sh/';
  const WARP_API = 'https://api.cloudflareclient.com/v0a737/reg';

  const generateBtn = document.getElementById('generateBtn');
  const generateBtnText = document.getElementById('generateBtnText');
  const copyBtn = document.getElementById('copyBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const configOutput = document.getElementById('configOutput');
  const outputSection = document.getElementById('outputSection');
  const errorDiv = document.getElementById('error');
  const errorText = document.getElementById('errorText');
  const optionsForm = document.getElementById('optionsForm');
  const qrCodeDiv = document.getElementById('qrCode');
  const dnsSelect = document.getElementById('f-dns');
  const dnsCustomWrap = document.getElementById('f-dns-custom-wrap');
  const dnsCustomInput = document.getElementById('f-dns-custom');
  const aipSelect = document.getElementById('f-aip');
  const aipCustomWrap = document.getElementById('f-aip-custom-wrap');
  const aipCustomInput = document.getElementById('f-aip-custom');

  dnsSelect.addEventListener('change', () => {
    const isCustom = dnsSelect.value === 'custom';
    dnsCustomWrap.classList.toggle('hidden', !isCustom);
    if (isCustom) dnsCustomInput.focus();
  });

  aipSelect.addEventListener('change', () => {
    const isCustom = aipSelect.value === 'custom';
    aipCustomWrap.classList.toggle('hidden', !isCustom);
    if (isCustom) aipCustomInput.focus();
  });

  function showError(message) {
    errorText.textContent = message;
    errorDiv.classList.remove('hidden');
  }
  function hideError() {
    errorDiv.classList.add('hidden');
  }

  function getOptions() {
    const formData = new FormData(optionsForm);
    const dns = dnsSelect.value === 'custom'
      ? (dnsCustomInput.value.trim() || '1.1.1.1, 1.0.0.1')
      : dnsSelect.value;
    const allowedIps = aipSelect.value === 'custom'
      ? (aipCustomInput.value.trim() || '0.0.0.0/0')
      : aipSelect.value;
    return {
      dns,
      mtu: formData.get('mtu'),
      allowedIps,
      keepalive: formData.get('keepalive'),
      deviceType: formData.get('deviceType'),
      locale: formData.get('locale')
    };
  }

  function formatDate(isoString) {
    if (!isoString) return '–';
    return new Date(isoString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function displayAccountInfo(warpResponse) {
    document.getElementById('accountId').textContent = 'Account ' + (warpResponse.account?.id || '–');
    document.getElementById('deviceId').textContent = warpResponse.id || '–';
    const typeEl = document.getElementById('accountType');
    typeEl.textContent = (warpResponse.account?.warp_plus ? 'WARP+ ' : '') + (warpResponse.account?.account_type || 'free');
    document.getElementById('license').textContent = warpResponse.account?.license || '–';
    document.getElementById('created').textContent = formatDate(warpResponse.created);
    document.getElementById('expires').textContent = formatDate(warpResponse.account?.ttl);
  }

  async function generateQRCode(config) {
    qrCodeDiv.innerHTML = '';
    try {
      await QRCode.toCanvas(qrCodeDiv.appendChild(document.createElement('canvas')), config, {
        width: 232, margin: 0, errorCorrectionLevel: 'M'
      });
    } catch (err) {
      qrCodeDiv.innerHTML = '<p style="color:#57544e;font-family:var(--font-mono);font-size:0.75rem;padding:1rem;">QR code generation failed</p>';
    }
  }

  async function registerWithWarp(publicKey, options) {
    const payload = {
      key: publicKey,
      install_id: '',
      warp_enabled: true,
      tos: new Date().toISOString(),
      type: options.deviceType,
      locale: options.locale
    };

    const response = await fetch(CORS_PROXY + WARP_API, {
      method: 'POST',
      headers: {
      headers: { "x-cors-api-key": "live_ca97101dafae7f7538dff6e05b91b7bbf27c96914db6a5a4" },
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok || data.success === false) {
      const errorMsg = data.errors?.[0]?.message || data.error?.message || 'Unknown error';
      throw new Error(`API error: ${errorMsg}`);
    }
    return data;
  }

  function generateConfig(privateKey, warpResponse, options) {
    const peer = warpResponse.config.peers[0];
    const iface = warpResponse.config.interface;

    let config = `[Interface]
PrivateKey = ${privateKey}
Address = ${iface.addresses.v4}/32, ${iface.addresses.v6}/128
DNS = ${options.dns}
MTU = ${options.mtu}

[Peer]
PublicKey = ${peer.public_key}
AllowedIPs = ${options.allowedIps}
Endpoint = ${peer.endpoint.host}`;

    if (options.keepalive && options.keepalive !== '0') {
      config += `\nPersistentKeepalive = ${options.keepalive}`;
    }
    return config;
  }

  let currentConfig = null;

  function wipeOutput() {
    currentConfig = null;
    configOutput.textContent = '';
    qrCodeDiv.innerHTML = '';
    document.getElementById('accountId').textContent = '–';
    document.getElementById('accountType').textContent = 'free';
    document.getElementById('deviceId').textContent = '–';
    document.getElementById('license').textContent = '–';
    document.getElementById('created').textContent = '–';
    document.getElementById('expires').textContent = '–';
    outputSection.classList.add('hidden');
  }

  function wipeSensitiveData() {
    wipeOutput();
    dnsCustomInput.value = '';
    aipCustomInput.value = '';
    dnsCustomWrap.classList.add('hidden');
    aipCustomWrap.classList.add('hidden');
    dnsSelect.value = '1.1.1.1, 1.0.0.1';
    aipSelect.value = '0.0.0.0/0';
  }

  generateBtn.addEventListener('click', async () => {
    hideError();
    wipeOutput();
    generateBtn.disabled = true;
    generateBtnText.textContent = 'Generating…';

    try {
      const keypair = window.wireguard.generateKeypair();
      const options = getOptions();
      const warpResponse = await registerWithWarp(keypair.publicKey, options);
      const config = generateConfig(keypair.privateKey, warpResponse, options);

      displayAccountInfo(warpResponse);
      await generateQRCode(config);
      currentConfig = config;
      configOutput.textContent = config;
      outputSection.classList.remove('hidden');
    } catch (err) {
      showError(err.message);
      outputSection.classList.add('hidden');
    } finally {
      generateBtn.disabled = false;
      generateBtnText.textContent = 'Generate WARP config';
    }
  });

  copyBtn.addEventListener('click', async () => {
    if (!currentConfig) return;
    try {
      await navigator.clipboard.writeText(currentConfig);
      copyBtn.textContent = 'Copied';
      copyBtn.classList.add('copied');
      setTimeout(() => { copyBtn.textContent = 'Copy'; copyBtn.classList.remove('copied'); }, 2000);
    } catch (err) {
      showError('Failed to copy to clipboard');
    }
  });

  downloadBtn.addEventListener('click', () => {
    if (!currentConfig) return;
    const blob = new Blob([currentConfig], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'warp.conf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  document.getElementById('clearBtn').addEventListener('click', wipeSensitiveData);

  window.addEventListener('pagehide', wipeSensitiveData);
  window.addEventListener('beforeunload', wipeSensitiveData);
