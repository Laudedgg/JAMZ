import ngrok from 'ngrok';
import { spawn } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

// Start the Express server
const server = spawn('node', ['server.js'], { stdio: 'inherit' });

// Handle server process exit
server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});

// Start ngrok tunnel
async function startNgrok() {
  try {
    const url = await ngrok.connect({
      addr: process.env.PORT || 5000,
      region: 'us',
    });
    
    console.log(`
    ╔════════════════════════════════════════════════════════════════╗
    ║                                                                ║
    ║   Ngrok tunnel is running!                                     ║
    ║                                                                ║
    ║   - Local URL: http://localhost:${process.env.PORT || 5000}                      ║
    ║   - Public URL: ${url}                   ║
    ║                                                                ║
    ║   You can access your API from anywhere using the Public URL   ║
    ║                                                                ║
    ╚════════════════════════════════════════════════════════════════╝
    `);
    
    console.log('\nIMPORTANT: Update your frontend API_URL to point to this ngrok URL');
    console.log('For example, in src/lib/api.ts, change:');
    console.log('const API_URL = \'http://localhost:5001/api\';');
    console.log('to:');
    console.log(`const API_URL = '${url}/api';`);
    
    // Handle process termination
    process.on('SIGINT', async () => {
      console.log('Shutting down ngrok tunnel...');
      await ngrok.kill();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Error starting ngrok tunnel:', error);
    process.exit(1);
  }
}

startNgrok();
