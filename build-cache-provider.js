const { createHash, X509Certificate } = require('crypto');
const { createWriteStream, existsSync, cp } = require('fs');
const { Agent, request } = require('https');
const os = require('os');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const cpAsync = promisify(cp);

const SERVER_CERTIFICATE = `
-----BEGIN CERTIFICATE-----
MIIDETCCAfmgAwIBAgIUOm5D9uuQKf5kWzeIRpDzfGWXGc0wDQYJKoZIhvcNAQEL
BQAwIDEeMBwGA1UEAwwVYXBwanMtd29ya3Nob3BzLmxvY2FsMB4XDTI1MDUyMjA4
MTQ1NloXDTI2MDUyMjA4MTQ1NlowIDEeMBwGA1UEAwwVYXBwanMtd29ya3Nob3Bz
LmxvY2FsMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAnYwzz3ACmNuD
KdBeAvLbdgkI9KyB7l5jRaFO1kz4c1isdj11fEacplaJlTof8+YzdzhJOpjmql2a
S2SY8vngjq7dagTLNCaBK/ImPfk2BkYdMkXmLfa3DS6s6bu03ZimylIi0PMxHaAM
MnPjGHbKeyimxP1l3S/yTKaIZroBRo5JrJA11IdCgpchETp7K535pCxBZiQlWfMq
GZJm27aAtqiflb9E25qRMYZbmVfcK046F7jiD2JriNhgG+Cw1UppJ4VHnW/nnjSP
0uL3FNNr+4EYqlerBlEQkOtmAAKntG20KLksEtpIOmqvp6wCiOWMIYCVdmLO0E/z
OXYZI/8u8QIDAQABo0MwQTAgBgNVHREEGTAXghVhcHBqcy13b3Jrc2hvcHMubG9j
YWwwHQYDVR0OBBYEFE1tOoLP5O2vY1Ke1YC5a0DgNFMjMA0GCSqGSIb3DQEBCwUA
A4IBAQAgnSDppdmqWHV5XqAx9QUNFJySCLXfuh4ZDs7fUKwlwSghE8a2FTjRMjyH
fdrW0M6uzWLHXRufJeaKAMTbUt3Ev/vEOjiPo0vv/rcgtXNbHxEWFTapstRYNhFh
R7MbQnYy7E4q3Rq5XodnchrKDBK5xJlkY0ccI20v8r+OKvIgfmJgviucFDyT4So6
TVjmczGM3eIcANRRhDN+eozI8rsbvlQIPYt6y4m0W57zLRjz2Wjg8GH/5Fqxr551
D3QsM+nG/ahwsncPSNHrCIbg/eg7IZriDIe02K0pvvniuVG7elIN0FiPybhpdnPT
ctvs3i+V7b+AibORKtyZya6WGDGh
-----END CERTIFICATE-----
`;
const PUB_KEY_HASH = createHash('sha256')
  .update(
    new X509Certificate(SERVER_CERTIFICATE).publicKey.export({
      type: 'spki',
      format: 'der',
    })
  )
  .digest('base64');

const getBuildFileInfo = (props) => {
  const extension = props.platform === 'ios' ? 'app' : 'apk';
  const fileName = `build.${props.fingerprintHash}.${extension}`;
  const localCachePath = path.join(os.tmpdir(), fileName);
  const remoteCacheUrl = `https://appjs-workshops.local/${fileName}${
    props.platform === 'ios' ? '.tgz' : ''
  }`;
  return { fileName, localCachePath, remoteCacheUrl };
};

const plugin = {
  resolveBuildCache: async (props) => {
    const { localCachePath, remoteCacheUrl } = getBuildFileInfo(props);

    // Check if file exists locally first
    if (existsSync(localCachePath)) {
      console.log('Using local cache file:', localCachePath);
      return localCachePath;
    }

    try {
      console.log('Searching for remote builds...');
      const url = new URL(remoteCacheUrl);
      const agent = new Agent({
        rejectUnauthorized: true,
        connectTimeout: 2500,
        checkServerIdentity: (_hostname, cert) => {
          const pubkeyHash = createHash('sha256')
            .update(cert.pubkey)
            .digest('base64');
          if (pubkeyHash !== PUB_KEY_HASH) {
            return new Error('Certificate pinning failed');
          }
          return undefined;
        },
      });

      const response = await new Promise((resolve, reject) => {
        const req = request(
          {
            hostname: url.hostname,
            path: url.pathname,
            method: 'GET',
            agent,
            ca: SERVER_CERTIFICATE,
          },
          (res) => {
            if (res.statusCode === 200) {
              const tempDownloadPath = `${localCachePath}.download`;
              const fileStream = createWriteStream(tempDownloadPath);
              res.pipe(fileStream);
              fileStream.on('finish', async () => {
                fileStream.close();

                try {
                  if (url.pathname.endsWith('.tgz')) {
                    // Extract the tgz to the final location
                    await execAsync(
                      `tar -xzf "${tempDownloadPath}" -C "${path.dirname(
                        localCachePath
                      )}"`
                    );
                    if (existsSync(localCachePath)) {
                      console.log('Extracted build to:', localCachePath);
                    } else {
                      throw new Error('Failed to extract build');
                    }
                  } else {
                    // Move the downloaded file to the final location
                    await cpAsync(tempDownloadPath, localCachePath, {
                      recursive: true,
                    });
                    console.log('Moved build to:', localCachePath);
                  }
                  resolve(localCachePath);
                } catch (err) {
                  console.log('Error processing downloaded file:', err);
                  reject(err);
                }
              });
            } else if (res.statusCode === 404) {
              console.log('Remote cache miss: Build not found on server');
              resolve(null);
            } else {
              reject(new Error(`HTTP Error: ${res.statusCode}`));
            }
          }
        );

        req.on('error', (err) => {
          reject(err);
        });
        req.end();
      });

      return response;
    } catch (err) {
      console.log('Unable to fetch remote build cache');
      return null;
    }
  },
  uploadBuildCache: async (props) => {
    const { localCachePath } = getBuildFileInfo(props);

    try {
      // Copy the build file/directory to the local cache
      await cpAsync(props.buildPath, localCachePath, { recursive: true });
      console.log('Cached build locally:', localCachePath);
      return null;
    } catch (err) {
      console.log('Unable to cache build:', err);
      return null;
    }
  },
};

module.exports = plugin;
