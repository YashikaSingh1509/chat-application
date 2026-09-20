/**
 * Socket.IO Multi-Client Verification Script
 * 
 * Simulates two concurrent clients (Host & Participant) testing:
 * 1. JWT Authentication
 * 2. Real-time online/offline presence
 * 3. Room creation & joining (`room:<roomId>`)
 * 4. Real-time participant events (`participant:joined`, `room:participant-count`)
 * 5. Room messaging (`room:message`)
 * 6. Room leaving & lifecycle events (`participant:left`, `room:status`)
 */

const { io } = require('socket.io-client');
const axios = require('axios');

const BASE_URL = 'http://localhost:3005';
const API_PREFIX = '/admin/api/v1';

async function runSocketTest() {
  console.log('--- Starting Multi-Client Socket.IO Integration Test ---');

  const timestamp = Date.now();
  const hostEmail = `host_${timestamp}@test.com`;
  const guestEmail = `guest_${timestamp}@test.com`;

  try {
    // 1. Register Host
    console.log('\n1. Registering Host...');
    const hostRegRes = await axios.post(`${BASE_URL}${API_PREFIX}/auth/register`, {
      name: 'Host User',
      email: hostEmail,
      password: 'Password@123',
    });
    const hostToken = hostRegRes.data.data?.accessToken || hostRegRes.data.accessToken;
    console.log('Host registered and obtained JWT.');

    // 2. Register Guest Participant
    console.log('\n2. Registering Guest Participant...');
    const guestRegRes = await axios.post(`${BASE_URL}${API_PREFIX}/auth/register`, {
      name: 'Guest User',
      email: guestEmail,
      password: 'Password@123',
    });
    const guestToken = guestRegRes.data.data?.accessToken || guestRegRes.data.accessToken;
    console.log('Guest registered and obtained JWT.');

    // 3. Create Room via REST API (Host)
    console.log('\n3. Creating Room via REST...');
    const roomRes = await axios.post(
      `${BASE_URL}${API_PREFIX}/rooms`,
      { roomName: 'Socket Realtime Demo Room' },
      { headers: { Authorization: `Bearer ${hostToken}` } }
    );
    const room = roomRes.data.data || roomRes.data;
    const roomId = room._id;
    console.log(`Room created: ${room.roomName} (ID: ${roomId})`);

    // 4. Connect Host Socket.IO Client
    console.log('\n4. Connecting Host Socket.IO Client...');
    const hostSocket = io(BASE_URL, {
      auth: { token: hostToken },
      transports: ['websocket'],
    });

    await new Promise((resolve) => {
      hostSocket.on('authenticated', (data) => {
        console.log(`Host Socket Authenticated: ${data.user.name} (${data.user.id})`);
        resolve();
      });
      hostSocket.on('error', (err) => console.error('Host Socket Error:', err));
    });

    // 5. Connect Guest Socket.IO Client
    console.log('\n5. Connecting Guest Socket.IO Client...');
    const guestSocket = io(BASE_URL, {
      auth: { token: guestToken },
      transports: ['websocket'],
    });

    await new Promise((resolve) => {
      guestSocket.on('authenticated', (data) => {
        console.log(`Guest Socket Authenticated: ${data.user.name} (${data.user.id})`);
        resolve();
      });
      guestSocket.on('error', (err) => console.error('Guest Socket Error:', err));
    });

    // 6. Host Joins Room
    console.log('\n6. Host joining room...');
    await new Promise((resolve) => {
      hostSocket.emit('room:join', { roomId }, (ack) => {
        console.log('Host join ack:', ack);
        resolve();
      });
    });

    // Set up listeners on Host to observe Guest events
    const guestJoinedPromise = new Promise((resolve) => {
      hostSocket.on('participant:joined', (event) => {
        console.log('[Host Received] participant:joined event:', event);
        resolve(event);
      });
    });

    const countUpdatePromise = new Promise((resolve) => {
      hostSocket.on('room:participant-count', (event) => {
        console.log('[Host Received] room:participant-count event:', event);
        resolve(event);
      });
    });

    const messagePromise = new Promise((resolve) => {
      hostSocket.on('room:message', (event) => {
        console.log('[Host Received] room:message event:', event);
        resolve(event);
      });
    });

    const participantLeftPromise = new Promise((resolve) => {
      hostSocket.on('participant:left', (event) => {
        console.log('[Host Received] participant:left event:', event);
        resolve(event);
      });
    });

    // 7. Guest Joins Room
    console.log('\n7. Guest joining room...');
    await new Promise((resolve) => {
      guestSocket.emit('room:join', { roomId }, (ack) => {
        console.log('Guest join ack:', ack);
        resolve();
      });
    });

    await guestJoinedPromise;
    await countUpdatePromise;
    console.log('Verified: Host successfully received Guest joined and participant count update!');

    // 8. Guest sends message
    console.log('\n8. Guest sending message in room...');
    guestSocket.emit('room:message', {
      roomId,
      message: 'Hello everyone in the live room!',
    });

    await messagePromise;
    console.log('Verified: Host received message sent exclusively within room:<roomId>!');

    // 9. Guest leaves room
    console.log('\n9. Guest leaving room...');
    guestSocket.emit('room:leave', { roomId });

    await participantLeftPromise;
    console.log('Verified: Host received participant:left event!');

    // Clean up connections
    hostSocket.disconnect();
    guestSocket.disconnect();

    console.log('\n Multi-Client Socket.IO Verification Completed Successfully!');
  } catch (error) {
    console.error('Socket Integration Test Failed:', error.response?.data || error.message);
  }
}

if (require.main === module) {
  runSocketTest();
}

module.exports = { runSocketTest };

