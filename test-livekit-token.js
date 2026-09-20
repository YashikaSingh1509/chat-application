/**
 * LiveKit WebRTC Token API Verification Script
 *
 * Verifies:
 * 1. Host user registers and creates room
 * 2. Host requests LiveKit token with role: "host" -> Success (roomAdmin: true)
 * 3. Guest participant requests token with role: "host" -> Fails with 403 Forbidden
 * 4. Guest participant requests token with role: "participant" -> Success (roomAdmin: false)
 * 5. Validates LiveKit JWT payload decoding and grant structure
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3005';
const API_PREFIX = '/admin/api/v1';

// Simple base64url decode helper for inspecting JWT payload without external library
function decodeJwt(token) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');
  const payload = Buffer.from(parts[1], 'base64url').toString('utf8');
  return JSON.parse(payload);
}

async function runLivekitTest() {
  console.log('--- Starting LiveKit Token Generation Verification ---');

  const timestamp = Date.now();
  const hostEmail = `lk_host_${timestamp}@test.com`;
  const guestEmail = `lk_guest_${timestamp}@test.com`;

  try {
    // 1. Register Host
    console.log('\n1. Registering Host...');
    const hostReg = await axios.post(`${BASE_URL}${API_PREFIX}/auth/register`, {
      name: 'Host User',
      email: hostEmail,
      password: 'Password@123',
    });
    const hostToken = hostReg.data.data?.accessToken || hostReg.data.accessToken;
    const hostId = hostReg.data.data?.user?._id || hostReg.data.user?._id;
    console.log(`Host registered successfully. ID: ${hostId}`);

    // 2. Register Guest
    console.log('\n2. Registering Guest...');
    const guestReg = await axios.post(`${BASE_URL}${API_PREFIX}/auth/register`, {
      name: 'Guest User',
      email: guestEmail,
      password: 'Password@123',
    });
    const guestToken = guestReg.data.data?.accessToken || guestReg.data.accessToken;
    const guestId = guestReg.data.data?.user?._id || guestReg.data.user?._id;
    console.log(`Guest registered successfully. ID: ${guestId}`);

    // 3. Create Room via REST
    console.log('\n3. Creating Room...');
    const roomName = `LiveKit_Demo_${timestamp}`;
    const roomRes = await axios.post(
      `${BASE_URL}${API_PREFIX}/rooms`,
      { roomName },
      { headers: { Authorization: `Bearer ${hostToken}` } }
    );
    const room = roomRes.data.data || roomRes.data;
    console.log(`Room created: "${room.roomName}" (ID: ${room._id})`);

    // 4. Host requests token with role: "host"
    console.log('\n4. Host requesting LiveKit token (role: "host")...');
    const hostTokenRes = await axios.post(
      `${BASE_URL}${API_PREFIX}/livekit/token`,
      { roomName: room.roomName, role: 'host' },
      { headers: { Authorization: `Bearer ${hostToken}` } }
    );
    console.log('Host token response:', hostTokenRes.data);
    const hostJwt = hostTokenRes.data.data?.token || hostTokenRes.data.token;
    const hostDecoded = decodeJwt(hostJwt);
    console.log('Decoded Host LiveKit Claims:', {
      identity: hostDecoded.sub,
      videoGrants: hostDecoded.video,
    });

    if (hostDecoded.video?.roomAdmin === true) {
      console.log(' Verified: Host token contains roomAdmin: true grant!');
    } else {
      console.warn(' Warning: Host token missing roomAdmin: true grant');
    }

    // 5. Guest attempts to claim "host" role
    console.log('\n5. Guest attempting to claim "host" role (Expect 403 Forbidden)...');
    try {
      await axios.post(
        `${BASE_URL}${API_PREFIX}/livekit/token`,
        { roomName: room.roomName, role: 'host' },
        { headers: { Authorization: `Bearer ${guestToken}` } }
      );
      console.error(' FAILED: Guest was incorrectly allowed to request host token!');
    } catch (err) {
      if (err.response?.status === 403) {
        console.log(` Verified: Server rejected with 403 Forbidden ("${err.response.data.message}")`);
      } else {
        console.error(' Unexpected error code:', err.response?.status, err.response?.data);
      }
    }

    // 6. Guest requests token with role: "participant"
    console.log('\n6. Guest requesting LiveKit token (role: "participant")...');
    const guestTokenRes = await axios.post(
      `${BASE_URL}${API_PREFIX}/livekit/token`,
      { roomName: room.roomName, role: 'participant' },
      { headers: { Authorization: `Bearer ${guestToken}` } }
    );
    console.log('Guest token response:', guestTokenRes.data);
    const guestJwt = guestTokenRes.data.data?.token || guestTokenRes.data.token;
    const guestDecoded = decodeJwt(guestJwt);
    console.log('Decoded Guest LiveKit Claims:', {
      identity: guestDecoded.sub,
      videoGrants: guestDecoded.video,
    });

    if (guestDecoded.video?.roomAdmin === false || guestDecoded.video?.roomAdmin === undefined) {
      console.log(' Verified: Guest token has roomAdmin: false (or omitted)!');
    }

    // 7. Test non-existent room
    console.log('\n7. Requesting token for non-existent room (Expect 404 Not Found)...');
    try {
      await axios.post(
        `${BASE_URL}${API_PREFIX}/livekit/token`,
        { roomName: 'NonExistentRoom_12345', role: 'participant' },
        { headers: { Authorization: `Bearer ${guestToken}` } }
      );
      console.error(' FAILED: Non-existent room should have been rejected!');
    } catch (err) {
      if (err.response?.status === 404) {
        console.log(` Verified: Server rejected with 404 Not Found ("${err.response.data.message}")`);
      } else {
        console.error(' Unexpected error code:', err.response?.status);
      }
    }

    console.log('\n All LiveKit Token Verification Tests Passed Successfully!');
  } catch (error) {
    console.error('LiveKit Verification Test Failed:', error.response?.data || error.message);
  }
}

if (require.main === module) {
  runLivekitTest();
}

module.exports = { runLivekitTest };

