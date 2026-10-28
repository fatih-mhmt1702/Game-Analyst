const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

let pythonProcess = null;

function checkHealth(port = 8000) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/health`, (res) => {
      if (res.statusCode === 200) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForBackend(port = 8000, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    const healthy = await checkHealth(port);
    if (healthy) return true;
    await new Promise((r) => setTimeout(r, 600));
  }
  return false;
}

function startPythonBackend() {
  return new Promise(async (resolve, reject) => {
    // Check if backend is already running
    const alreadyRunning = await checkHealth(8000);
    if (alreadyRunning) {
      console.log('[PythonManager] Backend service is already running on port 8000.');
      return resolve(null);
    }

    const projectRoot = path.join(__dirname, '..');
    console.log('[PythonManager] Spawning Python FastAPI backend...');

    pythonProcess = spawn('py', ['-3.13', '-m', 'uvicorn', 'backend.app.main:app', '--host', '127.0.0.1', '--port', '8000'], {
      cwd: projectRoot,
      env: { ...process.env, PYTHONUNBUFFERED: '1' },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    pythonProcess.stdout.on('data', (data) => {
      console.log(`[Python] ${data.toString().trim()}`);
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`[Python Error] ${data.toString().trim()}`);
    });

    pythonProcess.on('close', (code) => {
      console.log(`[PythonManager] Python backend exited with code ${code}`);
      pythonProcess = null;
    });

    const isUp = await waitForBackend(8000);
    if (isUp) {
      console.log('[PythonManager] Backend service is healthy and responding.');
      resolve(pythonProcess);
    } else {
      reject(new Error('Timed out waiting for Python backend service to start.'));
    }
  });
}

function stopPythonBackend() {
  if (pythonProcess) {
    console.log('[PythonManager] Terminating Python backend...');
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', pythonProcess.pid, '/f', '/t']);
      } else {
        pythonProcess.kill('SIGINT');
      }
    } catch (err) {
      console.error('[PythonManager] Error terminating backend:', err);
    }
    pythonProcess = null;
  }
}

module.exports = {
  startPythonBackend,
  stopPythonBackend
};
